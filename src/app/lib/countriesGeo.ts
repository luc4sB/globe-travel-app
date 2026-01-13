let countriesGeoJsonPromise: Promise<any> | null = null;

export function getCountriesGeoJSON(): Promise<any> {
  if (!countriesGeoJsonPromise) {
    countriesGeoJsonPromise = fetch("/data/countries.geojson")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load countries.geojson (${res.status})`);
        return res.json();
      })
      .catch((err) => {
        // If fails once allow retry 
        countriesGeoJsonPromise = null;
        throw err;
      });
  }
  return countriesGeoJsonPromise;
}
