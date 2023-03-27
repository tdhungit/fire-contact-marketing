export function assignObject(object: any, data: any) {
  for (let key in data) {
    if (object.hasOwnProperty(key)) {
      object[key] = data[key];
    }
  }
  return object;
}
