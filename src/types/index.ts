export interface PatientFormValues {
  name: string;
  age: string;
  gender: "male" | "female";
  job: string;
  symptoms: string;
  neck: "yes" | "partially" | "no";
  trunk: "yes" | "partially" | "no";
  standing: "yes" | "assisted" | "no";
  walking: "yes" | "assisted" | "no";
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
  job: string;
  symptoms: string;
  neck: "yes" | "partially" | "no";
  trunk: "yes" | "partially" | "no";
  standing: "yes" | "assisted" | "no";
  walking: "yes" | "assisted" | "no";
  medications: string;
  fractures: string;
}
