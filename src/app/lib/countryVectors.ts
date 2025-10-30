import * as THREE from "three";

const countryVectors = new Map<string, THREE.Vector3>();

export function setCountryVector(name: string, vector: THREE.Vector3) {
  countryVectors.set(name, vector.clone().normalize());
}

export function getCountryVector(name: string): THREE.Vector3 | undefined {
  const v = countryVectors.get(name);
  return v ? v.clone() : undefined;
}

export function hasCountryVector(name: string): boolean {
  return countryVectors.has(name);
}

export function getAllCountryVectors() {
  return Array.from(countryVectors.entries());
}
