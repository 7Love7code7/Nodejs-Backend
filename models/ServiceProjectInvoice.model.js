"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;


  var projectInvoiceSchema = new Schema(
{
    totalWithoutTax:Number,
    totalTaxAmount:Number,
    invoiceTotal:Number,
    listDriverItems:[],
    listMatItems:[{
        matId:{
            type: Schema.Types.ObjectId,
             ref: "Material"
        },
        matName:{
            type:String
        },
        unitPrice:{
            type:Number
        },
        quantity:{
            type:Number
        },
        rowTotal:{
            type:Number
        }
    }],
    listEqItems:[{
        eqId:{
            type: Schema.Types.ObjectId,
            ref: "Equipment"
        },
        eqName:{
            type:String
        },
        unitPrice:{
            type:Number
        },
        quantity:{
            type:Number
        },
        rowTotal:{
            type:Number
        }
    }],
    currency:{
     currencyCode: {
      type: String
     },
     conversionFactor: {
       type: Number
     },
     date: {
       type: Date
     }
    },
    projectId:{
        type: Schema.Types.ObjectId,
        ref: "Project"
    },
    updated: {
        type: Date
    },
    created: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String
    }

}
);


module.exports = mongoose.model("projectInvoice", projectInvoiceSchema);
