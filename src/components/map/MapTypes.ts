export interface MapCameraNode {
  id: string;
  name: string;
  location: string;
  x: number; // percentage coordinate on SVG grid
  y: number; // percentage coordinate on SVG grid
  rtspUrl: string;
  status: "ONLINE" | "OFFLINE" | "THREAT";
}
