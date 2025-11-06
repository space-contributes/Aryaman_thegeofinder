export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapSource {
  title: string;
  uri: string;
  placeAnswerSources?: {
    reviewSnippets?: {
        uri: string;
        text: string;
    }[];
  }[];
}

export interface GroundingChunk {
  maps: MapSource;
}
