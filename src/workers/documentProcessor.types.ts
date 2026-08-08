/** Heavy document operations the worker can simulate. */
export type DocumentActionType =
  | 'PROCESS_CHUNK'
  | 'SPLIT_DOCUMENT'
  | 'MERGE_PAGES';

/** Message sent from the UI thread to the document worker. */
export interface DocumentWorkerRequest {
  action: DocumentActionType;
  fileName: string;
  sizeBytes: number;
}

/** Progress tick emitted on every processing step. */
export interface DocumentProgressMessage {
  status: 'PROGRESS';
  action: DocumentActionType;
  progress: number;
}

/** Final message with a simulated success payload. */
export interface DocumentCompleteMessage {
  status: 'COMPLETE';
  action: DocumentActionType;
  payload: {
    fileName: string;
    processedBytes: number;
    durationMs: number;
    resultFiles: number;
  };
}

export type DocumentWorkerResponse =
  | DocumentProgressMessage
  | DocumentCompleteMessage;
