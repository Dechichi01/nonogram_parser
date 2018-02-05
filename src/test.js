const nonogramParser = require('./parseNonogram.js')

const pdfBasePath = `LITTLE_CRY_medium_edge.pdf`

async function test() {
    console.log(await nonogramParser.nonogramFromPdf(pdfBasePath))
}

test()
