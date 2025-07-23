export interface PatientFormValues {
  name: string;
  age: string;
  gender: "male" | "female";
  neck: "yes" | "partially" | "no";
  trunk: "yes" | "partially" | "no";
  standing: "yes" | "with assistance" | "no";
  walking: "yes" | "with assistance" | "no";
  medications: "yes" | "no";
  medications_details: string;
  fractures: "yes" | "no";
  fractures_details: string;
}

export interface PatientDataForAI {
  fileNumber: string;
  name: string;
  age: number;
  gender: "male" | "female";
  neck: "yes" | "partially" | "no";
  trunk: "yes" | "partially" | "no";
  standing: "yes" | "with assistance" | "no";
  walking: "yes" | "with assistance" | "no";
  medications: string;
  fractures: string;
}
