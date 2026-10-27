function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function unaccentIncludes(string, term) {
    return normalize(string).includes(normalize(term));
}