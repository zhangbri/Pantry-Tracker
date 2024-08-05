import handler from './cors';  

export default async function yourApi(req, res) {
  await handler(req, res);  
  if (req.method === 'POST') {
    res.status(200).json({ message: 'POST request processed' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}