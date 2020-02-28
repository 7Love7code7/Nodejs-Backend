const request = require("request");
const fs = require('fs');
const stream = require('stream');
var pdf = require('html-pdf');
const ConstructionNote = require('../models/constructionNote.model');

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

module.exports = {

    getAllConstructionNotes: async (req, res) => {
        try {
            let constructionNotes = await ConstructionNote.find().sort({updated: 'desc'});

            return res.status(200).json({
                message: "Construction Notes fetched successfully",
                notes: constructionNotes
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    getConstructionNoteById: async (req, res) => {
        try {
            const { id } = req.params;

            let constructionNote = await ConstructionNote.findById(id);

            request.get(constructionNote.url, function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    return res.status(200).json({
                        message: "Construction Note fetched successfully",
                        note: constructionNote,
                        content: body
                    });
                }
                else {
                    return res.status(500).json({
                        message: "Internal server error"
                    })
                }
            });
        } catch (e) {
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    saveConstructionNote: async (req, res) => {
        try {
            if (req.body.id == '') {
                let constructionNote = await new ConstructionNote();
                constructionNote.userId = req.user._id;
                constructionNote.createdBy = req.user.firstName + " " + req.user.lastName;
                constructionNote.title = req.body.title;
                constructionNote.type = 'note';

                const buffer = new Buffer(req.body.content);
                cloudinary.uploader.upload("data:text/plain;base64," + buffer.toString('base64'), {resource_type: 'raw'}, async function(err, data) {
                    if (err) {
                        //console.log('error: ', err);
                        res.status(500).json({
                            message: "Internal server error"
                        });
                    }
                    else {
                        constructionNote.public_id = data.public_id;
                        constructionNote.url = data.secure_url;
                        constructionNote.created = Date.now();
                        constructionNote.updated = Date.now();
                        await constructionNote.save();
                        //console.log('note:', constructionNote);
                        
                        res.status(200).json({
                            message: "Construction Note created successfully",
                            id: constructionNote._id
                        });
                    }
                });
            }
            else {
                let constructionNote = await ConstructionNote.findById(req.body.id);
                const buffer = new Buffer(req.body.content);
                cloudinary.uploader.upload("data:text/plain;base64," + buffer.toString('base64'), {resource_type: 'raw', public_id: constructionNote.public_id, overwrite: true}, async function(err, data) {
                    if (err) {
                        res.status(500).json({
                            message: "Internal server error"
                        });
                    }
                    else {
                        constructionNote.updated = Date.now();
                        constructionNote.url = data.secure_url;
                        await constructionNote.save();
                        res.status(200).json({
                            message: "Construction Note created successfully",
                            id: constructionNote._id
                        });
                    }
                });
            }
        } catch (e) {
            //console.log(e);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    downloadConstructionNote: async (req, res) => {
        try {
            const htmlheader = fs.readFileSync('constructionNotes/htmlheader.txt', 'utf8');
            const data = htmlheader + req.body.content + '</body></html>';
            var options = {
                width: '597px',
                height: '794px',
                border: {
                    "top": "76px",            // default is 0, units: mm, cm, in, px
                    "right": "0",
                    "bottom": "76px",
                    "left": "0"
                }
            };
            pdf.create(data, options).toBuffer(function(err, buffer) {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error"
                    });
                }
                else {
                    const readStream = new stream.PassThrough();
                    readStream.end(buffer.toString('base64'));
                    res.set('Content-disposition', `attachment; filename=${req.body.title}.pdf` );
                    res.set('Content-type', 'octet/stream');
                    
                    readStream.pipe(res);
                }
            });
        } catch (e) {
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    deleteConstructionNoteById: async (req, res) => {
        try {
            const {id} = req.params;
            let constructionNote = await ConstructionNote.findById(id);

            cloudinary.uploader.destroy(constructionNote.public_id, {resource_type: 'raw'}, async function(err, data) {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error"
                    });
                }
                else {
                    await constructionNote.remove();
                    return res.status(200).json({
                        message: "Construction Note deleted successfully"
                    });
                }
            });
        } catch (e) {
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

};
