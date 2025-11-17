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
  const { _id, ...rest } = doc;
  const id = _id != null ? String(_id) : undefined;
  return id ? { id, _id: id, ...rest } : rest;
}

export function serializeMany(docs = []) {
  return Array.isArray(docs) ? docs.map(serializeId) : [];
}