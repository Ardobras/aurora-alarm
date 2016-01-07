# Aurora Alarm
A (live) alarm for polar lights. It watches all sky cams, analyses the image and fires an alarm on all clients if the picture content matches all alarm criterias. This version is designed to work with the [Tromso all sky cam](http://polaris.nipr.ac.jp/~acaurora/aurora/Tromso/) but it can be adapted easily to other all sky cams or normal webcams.

## Demo

A hosted version for the all sky cam from Tromsø, Norway is set up at [https://keno.digital/project/aurora-alarm](https://keno.digital/project/aurora-alarm)

## Installation instructions

1. Clone Repo
2. Run `npm install`
3. Install [ImageMagick](http://www.imagemagick.org/)
4. Rename `config-sample.json` to `config.json`
4. Run `npm start`

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT)

