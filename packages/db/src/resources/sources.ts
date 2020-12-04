import { logger } from "@truffle/db/logger";
const debug = logger("db:resources:sources");

import gql from "graphql-tag";

import { Definition } from "./types";

export const sources: Definition<"sources"> = {
  names: {
    resource: "source",
    Resource: "Source",
    resources: "sources",
    Resources: "Sources",
    resourcesMutate: "sourcesAdd"
  },
  createIndexes: [],
  idFields: ["contents", "sourcePath"],
  typeDefs: gql`
    type Source implements Resource {
      id: ID!
      sourcePath: String
      contents: String!
    }

    input SourceInput {
      contents: String!
      sourcePath: String
    }
  `
};
