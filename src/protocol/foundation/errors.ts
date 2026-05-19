export type TransitionErrorRetryability = "retryable" | "terminal" | "recoverable" | "review_required" | "ambiguous";

export type TransitionCommitState = "not_started" | "not_committed" | "committed" | "unknown" | "not_applicable";

export type HandshakeProtocolErrorMetadata = {
  retryability?: TransitionErrorRetryability;
  commitState?: TransitionCommitState;
  proofRef?: string | null;
  refusalRef?: string | null;
};

export class HandshakeProtocolError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly metadata: HandshakeProtocolErrorMetadata = {},
  ) {
    super(message);
  }
}

export class HandshakeAmbiguousCommitError extends HandshakeProtocolError {
  constructor(message = "Transition commit result is ambiguous.") {
    super("ambiguous_commit", message, 503, {
      retryability: "ambiguous",
      commitState: "unknown",
    });
  }
}
