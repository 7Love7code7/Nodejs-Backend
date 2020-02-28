const request = require("request");
const MediaPlanet = require('../models/mediaPlanet.model');
const Issue = require("../models/issues.model");
const EntityTag = require("../models/entityTag.model");
const Project = require("../models/project.model");
const __ = require("../helper/globals");
const Asset = require("../models/asset.model");
const user = require("../models/user.model");
const mongoose = require("mongoose");
const mime = require("mime-types");
const _ = require("lodash");
moment = require("moment");

module.exports = {

    getAllMediaPlanet: async (req, res) => {
        try {
            let mediaPlanets = await MediaPlanet.find();

            return res.status(200).json({
                message: "Media planet fetched successfully",
                data: mediaPlanets
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    getMediaPlanetsForProject: async (req, res) => {
        try {
            const { id } = req.params;

            let mediaPlanets = await MediaPlanet.find(
                {
                    projectId: id
                }
            );

            return res.status(200).json({
                message: "Media planet fetched successfully",
                data: mediaPlanets
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    getMediaPlanetForId: async (req, res) => {
        try {
            const { id } = req.params;

            let mediaPlanet = await MediaPlanet.findById(id)
                .populate({
                    path: 'projectId',
                    select: ["projectName startDate endDate address projectStatus isServiceProject created backupFolders systemTag projectImage"]
                });

            return res.status(200).json({
                message: "Media planet fetched successfully",
                data: mediaPlanet
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    createMediaPlanet: async (req, res) => {
        console.log("MediaPlanet: ", req.body);
        console.log("MediaPlanet: ", req.files);
        try {
            let mediaPlanet = await new MediaPlanet();
            mediaPlanet.userId = req.user._id;
            mediaPlanet.createdBy = req.user.firstName + " " + req.user.lastName;

            if(req.body.projectId) {
                mediaPlanet.projectId = req.body.projectId;
            }

            mediaPlanet.description = req.body.description;
           
            if (req.files && req.files.length > 0) {
                let files = req.files;
                for(var i=0; i<files.length; i++) {
                    console.log('ith file info', files[i]);
                    mediaPlanet.name = files[i]['originalname'];
                    mediaPlanet.size = {
                        width: files[i]['width'],
                        height: files[i]['height']
                    };
                    mediaPlanet.type = files[i]['format'];
                    mediaPlanet.url = files[i]['secure_url'];
                }
            }

            await mediaPlanet.save();

            return res.status(200).json({
                message: "Media planet created successfully",
                data: mediaPlanet
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    updateMediaPlanet: async (req, res) => {
        try {
            let fields = req.body;
            const { id } = req.params;

            let mediaPlanet = await MediaPlanet.findById(id);

            if(mediaPlanet) {
                mediaPlanet.name = fields.name;
                mediaPlanet.description = fields.description;
                await mediaPlanet.save();

                return res.status(200).json({
                    message: "Media Planet updated successfully",
                    data: mediaPlanet
                })
            } else {
                console.log("No MediaPlanet");
                return res.status(500).json({
                    message: "Internal server error"
                })    
            }
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    deleteMediaPlanets: async (req, res) => {
        try {
            let fields = req.body;

            for(var i=0; i<fields.items.length; i++) {
                await MediaPlanet.findByIdAndRemove(fields.items[i]);
            }

            return res.status(200).json({
                message: "Media Planet delete successfully"
            })
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    }

};
