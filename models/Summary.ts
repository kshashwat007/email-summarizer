import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";


const summarySchema = new mongoose.Schema({
  summary: {
      type: String,
      required: true
  },
  links: [{
      type: String
  }],
  action_items: [{
      type: String
  }],
  sender: {
      type: String,
      required: true
  },
  subject: {
      type: String,
      required: true
  },
  date: {
      type: Date,
      required: true
  }
});

// add plugin that converts mongoose to json
summarySchema.plugin(toJSON);

export default mongoose.models?.Summary || mongoose.model("Summary", summarySchema);
