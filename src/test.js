const nonogramParser = require('./parseNonogram.js')

const pdfBasePath = `${__dirname}/../pdf_backups/ballon_hard2.pdf`

nonogramParser.nonogramFromPdf(pdfBasePath, (err, json) => {
    console.log(json)
})
