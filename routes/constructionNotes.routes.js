const constructionNotes = require("../controllers/constructionNotes.controller");

module.exports = (openRoutes, apiRoutes) => {
    apiRoutes
        .route("/getConstructionNoteById/:id") // :id = ConstructionNoteId
        .get(constructionNotes.getConstructionNoteById);

    apiRoutes
        .route("/getAllConstructionNotes")
        .get(constructionNotes.getAllConstructionNotes);

    apiRoutes
        .route("/saveConstructionNote")
        .post(constructionNotes.saveConstructionNote);

    apiRoutes
        .route("/downloadConstructionNote")
        .post(constructionNotes.downloadConstructionNote);

    apiRoutes
        .route("/deleteConstructionNoteById/:id")
        .delete(constructionNotes.deleteConstructionNoteById);
};
