const vision = require('@google-cloud/vision');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
  }

  try {
    // Decode the Google Cloud credentials from base64
    const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    if (!base64Credentials) {
      throw new Error("Environment variable GOOGLE_APPLICATION_CREDENTIALS_BASE64 is not set");
    }

    const credentialsJSON = JSON.parse(Buffer.from(base64Credentials, 'base64').toString('utf8'));

    // Initialize Google Vision client with decoded credentials
    const client = new vision.ImageAnnotatorClient({
      credentials: credentialsJSON,
    });

    const { image } = req.body;

    // Perform label detection and object localization
    const [labelDetectionResult] = await client.labelDetection({ image: { content: image } });
    const [objectLocalizationResult] = await client.objectLocalization({ image: { content: image } });

    // List of specific items we want to detect
    const targetLabels = ['banana', 'mouse', 'water', 'orange', 'keyboard', 'headphones', 'glasses'];

    // Filter labels and objects based on a higher threshold and target list
    const labels = labelDetectionResult.labelAnnotations.filter(label =>
      label.score >= 0.8 && targetLabels.includes(label.description.toLowerCase())
    );

    const objects = objectLocalizationResult.localizedObjectAnnotations.filter(obj =>
      obj.score >= 0.8 && targetLabels.includes(obj.name.toLowerCase())
    );

    const combinedResults = {};

    objects.forEach(obj => {
      const name = obj.name.toLowerCase();
      const confidence = obj.score;

      if (!combinedResults[name]) {
        combinedResults[name] = { score: confidence, count: 1 };
      } else {
        combinedResults[name].score += confidence;
        combinedResults[name].count += 1;
      }
    });

    labels.forEach(label => {
      const name = label.description.toLowerCase();
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
      (a, b) => (a[1].score > b[1].score ? a : b),
      ['', { score: 0 }]
    )[0];

    res.status(200).json({ classification });
  } catch (error) {
    console.error('Error in classifyImage API:', error);
    res.status(500).json({ error: 'Failed to process image classification', details: error.message });
  }
}
