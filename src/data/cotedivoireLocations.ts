// Complete data for Côte d'Ivoire locations
// Based on official administrative divisions

export interface City {
  name: string;
  department: string;
}

export interface Department {
  name: string;
  region: string;
  cities: string[];
}

export interface Region {
  name: string;
  capital: string;
  departments: string[];
}

export const regions: Region[] = [
  { name: "Lagunes", capital: "Abidjan", departments: ["Abidjan", "Dabou", "Grand-Lahou", "Jacqueville", "Tiassalé", "Sikensi", "Agboville", "Taabo"] },
  { name: "Yamoussoukro (District Autonome)", capital: "Yamoussoukro", departments: ["Yamoussoukro"] },
  { name: "Vallée du Bandama", capital: "Bouaké", departments: ["Bouaké", "Katiola", "Dabakala", "Sakassou", "Béoumi"] },
  { name: "Sassandra-Marahoué", capital: "Daloa", departments: ["Daloa", "Vavoua", "Issia", "Sinfra", "Bouaflé", "Zuénoula"] },
  { name: "Bas-Sassandra", capital: "San-Pédro", departments: ["San-Pédro", "Soubré", "Tabou", "Sassandra", "Buyo", "Méagui", "Fresco"] },
  { name: "Savanes", capital: "Korhogo", departments: ["Korhogo", "Ferkessédougou", "Boundiali", "Tengrela", "Sinématiali", "M'Bengué", "Dikodougou"] },
  { name: "Montagnes", capital: "Man", departments: ["Man", "Biankouma", "Danané", "Zouan-Hounien", "Sipilou", "Kouibly", "Sangouiné", "Facobly"] },
  { name: "Comoé", capital: "Abengourou", departments: ["Abengourou", "Agnibilékrou", "Bettié", "Tanda"] },
  { name: "Zanzan", capital: "Bondoukou", departments: ["Bondoukou", "Tanda", "Bouna", "Nassian", "Transua"] },
  { name: "Gôh-Djiboua", capital: "Gagnoa", departments: ["Gagnoa", "Oumé", "Divo", "Lakota", "Guitry", "Fresco"] },
  { name: "Lacs", capital: "Dimbokro", departments: ["Dimbokro", "Toumodi", "Bongouanou", "Bocanda", "M'Bahiakro", "Prikro", "Daoukro"] },
  { name: "Denguélé", capital: "Odienné", departments: ["Odienné", "Minignan", "Madinani", "Kaniasso", "Gbéléban", "Samatiguila", "Séguélon"] },
  { name: "Woroba", capital: "Séguéla", departments: ["Séguéla", "Mankono", "Touba", "Koro", "Dianra", "Kounahiri", "Massala"] },
  { name: "Bélier", capital: "Toumodi", departments: ["Toumodi", "Tiébissou", "Didiévi", "Djékanou"] },
  { name: "Haut-Sassandra", capital: "Daloa", departments: ["Daloa", "Vavoua", "Issia", "Zoukougbeu"] },
  { name: "Poro", capital: "Korhogo", departments: ["Korhogo", "Sinématiali", "Dikodougou", "M'Bengué"] },
  { name: "Tchologo", capital: "Ferkessédougou", departments: ["Ferkessédougou", "Ouangolodougou", "Kong"] },
  { name: "Bagoué", capital: "Boundiali", departments: ["Boundiali", "Tengrela", "Kouto"] },
  { name: "Gbôklé", capital: "Sassandra", departments: ["Sassandra", "Fresco"] },
  { name: "Nawa", capital: "Soubré", departments: ["Soubré", "Buyo", "Guéyo", "Méagui"] },
  { name: "San-Pédro", capital: "San-Pédro", departments: ["San-Pédro", "Tabou"] },
  { name: "Cavally", capital: "Guiglo", departments: ["Guiglo", "Bloléquin", "Toulépleu", "Taï"] },
  { name: "Guémon", capital: "Duékoué", departments: ["Duékoué", "Bangolo", "Facobly", "Kouibly"] },
  { name: "Tonkpi", capital: "Man", departments: ["Man", "Biankouma", "Danané", "Zouan-Hounien", "Sipilou", "Sangouiné"] },
  { name: "Kabadougou", capital: "Odienné", departments: ["Odienné", "Madinani", "Gbéléban", "Séguélon"] },
  { name: "Folon", capital: "Minignan", departments: ["Minignan", "Kaniasso"] },
  { name: "Bafing", capital: "Touba", departments: ["Touba", "Koro", "Ouaninou"] },
  { name: "Béré", capital: "Mankono", departments: ["Mankono", "Dianra", "Kounahiri"] },
  { name: "Marahoué", capital: "Bouaflé", departments: ["Bouaflé", "Sinfra", "Zuénoula"] },
  { name: "Iffou", capital: "Daoukro", departments: ["Daoukro", "M'Bahiakro", "Prikro"] },
  { name: "N'Zi", capital: "Dimbokro", departments: ["Dimbokro", "Bocanda"] },
  { name: "Moronou", capital: "Bongouanou", departments: ["Bongouanou", "M'Batto", "Arrah"] },
  { name: "Indénié-Djuablin", capital: "Abengourou", departments: ["Abengourou", "Agnibilékrou", "Bettié"] },
  { name: "Bounkani", capital: "Bouna", departments: ["Bouna", "Doropo", "Nassian", "Téhini"] },
  { name: "Gontougo", capital: "Bondoukou", departments: ["Bondoukou", "Tanda", "Transua", "Koun-Fao", "Sandégué"] },
  { name: "Sud-Comoé", capital: "Aboisso", departments: ["Aboisso", "Adiaké", "Grand-Bassam", "Tiapoum", "Ayamé", "Maféré", "Assinie-Mafia"] },
  { name: "Agnéby-Tiassa", capital: "Agboville", departments: ["Agboville", "Tiassalé", "Taabo", "Sikensi"] },
  { name: "Grands-Ponts", capital: "Dabou", departments: ["Dabou", "Grand-Lahou", "Jacqueville"] },
  { name: "Mé", capital: "Adzopé", departments: ["Adzopé", "Akoupé", "Yakassé-Attobrou", "Alépé"] },
  { name: "La Mé", capital: "Adzopé", departments: ["Adzopé", "Akoupé", "Yakassé-Attobrou", "Alépé"] },
];

// Complete list of major cities
export const cities: string[] = [
  // Abidjan et communes
  "Abidjan", "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon", "Anyama", "Bingerville", "Songon",
  // Autres grandes villes
  "Yamoussoukro", "Bouaké", "Daloa", "San-Pédro", "Korhogo", "Man", "Abengourou", "Gagnoa", "Divo", "Soubré",
  "Grand-Bassam", "Dabou", "Agboville", "Adzopé", "Bondoukou", "Séguéla", "Odienné", "Ferkessédougou",
  "Dimbokro", "Katiola", "Bongouanou", "Issia", "Duékoué", "Guiglo", "Oumé", "Lakota", "Sinfra",
  "Bouaflé", "Mankono", "Touba", "Boundiali", "Tengrela", "Danané", "Biankouma", "Zouan-Hounien",
  "Sassandra", "Tabou", "Fresco", "Grand-Lahou", "Jacqueville", "Tiassalé", "Sikensi", "Taabo",
  "Aboisso", "Adiaké", "Ayamé", "Bouna", "Tanda", "Agnibilékrou", "Bettié", "Transua", "Nassian",
  "Toumodi", "Tiébissou", "Didiévi", "Djékanou", "Bocanda", "M'Bahiakro", "Prikro", "Daoukro",
  "Sakassou", "Béoumi", "Dabakala", "Dikodougou", "Sinématiali", "M'Bengué", "Ouangolodougou", "Kong",
  "Vavoua", "Zuénoula", "Bloléquin", "Toulépleu", "Taï", "Bangolo", "Facobly", "Kouibly", "Sangouiné", "Sipilou",
  "Minignan", "Kaniasso", "Madinani", "Gbéléban", "Samatiguila", "Séguélon", "Koro", "Ouaninou",
  "Dianra", "Kounahiri", "Massala", "Buyo", "Guéyo", "Méagui", "Zoukougbeu",
  "M'Batto", "Arrah", "Koun-Fao", "Sandégué", "Doropo", "Téhini", "Tiapoum", "Maféré", "Assinie-Mafia",
  "Akoupé", "Yakassé-Attobrou", "Alépé", "Kouto",
];

// Communes d'Abidjan
export const abidjanCommunes: string[] = [
  "Abobo",
  "Adjamé",
  "Attécoubé",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Treichville",
  "Yopougon",
  "Anyama",
  "Bingerville",
  "Songon",
];

// Function to search cities
export const searchCities = (query: string): string[] => {
  if (!query || query.length < 2) return cities.slice(0, 20);
  const lowerQuery = query.toLowerCase();
  return cities.filter(city => 
    city.toLowerCase().includes(lowerQuery)
  ).slice(0, 50);
};

// Function to get region by city
export const getRegionByCity = (cityName: string): string | null => {
  // Abidjan special case
  if (abidjanCommunes.includes(cityName) || cityName === "Abidjan") {
    return "Lagunes";
  }
  
  for (const region of regions) {
    if (region.capital === cityName) {
      return region.name;
    }
  }
  
  return null;
};
