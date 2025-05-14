
export interface LocationData {
  province: string;
  districts: string[];
}

export const sriLankaProvinces: LocationData[] = [
  {
    province: "Western",
    districts: ["Colombo", "Gampaha", "Kalutara"]
  },
  {
    province: "Central",
    districts: ["Kandy", "Matale", "Nuwara Eliya"]
  },
  {
    province: "Southern",
    districts: ["Galle", "Matara", "Hambantota"]
  },
  {
    province: "Northern",
    districts: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"]
  },
  {
    province: "Eastern",
    districts: ["Ampara", "Batticaloa", "Trincomalee"]
  },
  {
    province: "North Western",
    districts: ["Kurunegala", "Puttalam"]
  },
  {
    province: "North Central",
    districts: ["Anuradhapura", "Polonnaruwa"]
  },
  {
    province: "Uva",
    districts: ["Badulla", "Monaragala"]
  },
  {
    province: "Sabaragamuwa",
    districts: ["Kegalle", "Ratnapura"]
  }
];

export const getDistrictsForProvince = (province: string): string[] => {
  const provinceData = sriLankaProvinces.find(p => p.province === province);
  return provinceData ? provinceData.districts : [];
};
