import { ObjectId } from "mongodb";

export function toObjectId(value) {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === "string") {
    const s = value.trim();
    return ObjectId.isValid(s) ? new ObjectId(s) : null;
  }
  return null;
}


export function serializeId(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const out = { ...doc };
  const id = out._id;
  if (id && typeof id === "object" && typeof id.toString === "function") {
    out._id = id.toString();
  }
  return out;
}

export function serializeMany(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map(serializeId);
}