const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { image } = req.body;

    const [labelDetectionResult] = await client.labelDetection({ image: { content: image } });
    const [objectLocalizationResult] = await client.objectLocalization({ image: { content: image } });

    const labels = labelDetectionResult.labelAnnotations.filter(label => label.score >= 0.7);
    const objects = objectLocalizationResult.localizedObjectAnnotations.filter(obj => obj.score >= 0.7);

    const combinedResults = {};

    objects.forEach(obj => {
      const name = obj.name;
      const confidence = obj.score;

      if (!combinedResults[name]) {
        combinedResults[name] = { score: confidence, count: 1 };
      } else {
        combinedResults[name].score += confidence;
        combinedResults[name].count += 1;
      }
    });

    labels.forEach(label => {
      const name = label.description;
      const confidence = label.score;

      if (!combinedResults[name]) {
        combinedResults[name] = { score: confidence, count: 1 };
      } else {
        combinedResults[name].score += confidence;
        combinedResults[name].count += 1;
      }
    });

    for (const key in combinedResults) {
      combinedResults[key].score /= combinedResults[key].count;
    }

    const classification = Object.entries(combinedResults).reduce(
      (a, b) => (a[1].score > b[1].score ? a : b)
    )[0];

    res.status(200).json({ classification });
  } catch (error) {
    console.error('Error classifying image:', error);
    res.status(500).json({ error: 'Image classification failed', details: error.message });
  }
}