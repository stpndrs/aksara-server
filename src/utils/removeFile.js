const fs = require('fs')

const removeFile = (path) => {
    fs.unlinkSync('./' + path)
}

module.exports = removeFile