const sharp = require('sharp');
const path = require('path');

exports.optimizeImage = async (file) => {
  const fileName = `${file.originalname.split(' ').join('_')}-${Date.now()}.jpeg`;
  const outputPath = path.join('images', fileName);

  await sharp(file.buffer)
    .resize(206, 260)
    .toFormat('jpeg')
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  return fileName;
};
