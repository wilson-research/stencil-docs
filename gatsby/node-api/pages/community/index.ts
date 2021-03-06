import { resolve } from "path";
import {
  docsGenerator,
  DocsGeneratorReturnType,
  getContent,
  DocsContentDocs,
  DocsContentItem,
} from "../utils";
import { CommunityGQL } from "./types";
import {
  DOCS_DIR,
  COMMUNITY_DIR,
  ASSETS_DIR,
  COMMUNITY_GET_STARTED_TYPE,
  COMMUNITY_PATH_PREFIX,
} from "../../../constants";
import { CreatePageFn, GraphQLFunction } from "../../../types";

const extractFn = (
  doc: CommunityGQL,
  docsGroup: string,
  topicId: string,
): DocsContentDocs | null => {
  const {
    rawMarkdownBody,
    fields: {
      docInfo: { id, type, fileName },
    },
    frontmatter: { title, type: docType },
  } = doc;

  if (docsGroup === type && topicId === id) {
    let obj: DocsContentDocs = {
      order: fileName,
      title: title,
      source: rawMarkdownBody,
    };

    if (docType) {
      obj.type = docType;
    }

    return obj;
  }
  return null;
};

export interface CreateCommunityPages {
  graphql: GraphQLFunction;
  createPage: CreatePageFn;
}

export const createCommunityPages = async ({
  graphql,
  createPage,
}: CreateCommunityPages) => {
  const communityTemplate: string = resolve(
    __dirname,
    "../../../../src/views/community/index.tsx",
  );

  const docs = await getContent<CommunityGQL>(
    graphql,
    "/content/community/",
    `docInfo {
      id
      type
      fileName
    }`,
  );
  const {
    content,
    navigation,
    manifest,
  }: DocsGeneratorReturnType = docsGenerator<CommunityGQL>(
    docs,
    "community",
    extractFn,
  );

  Object.keys(content).map(docsType => {
    const topics = content[docsType];
    const topicsKeys = Object.keys(topics);

    topicsKeys.map(topic => {
      const assetsPath = `/${ASSETS_DIR}${COMMUNITY_DIR}${topic}/${DOCS_DIR}${ASSETS_DIR}`;
      let newContent = content[docsType][topic] as DocsContentItem;

      const path = `/${COMMUNITY_PATH_PREFIX}/${
        topicsKeys.length > 1 ? `${docsType}/` : ""
      }${topic}`;

      createPage({
        path: path,
        component: communityTemplate,
        context: {
          content: newContent,
          navigation,
          manifest,
          assetsPath,
          docsType,
          topic,
        },
      });

      if (
        COMMUNITY_GET_STARTED_TYPE === docsType &&
        COMMUNITY_GET_STARTED_TYPE === topic
      ) {
        createPage({
          path: `/${COMMUNITY_PATH_PREFIX}`,
          component: communityTemplate,
          context: {
            content: newContent,
            navigation,
            manifest,
            assetsPath,
            docsType,
            topic,
          },
        });
      }
    });
  });
};
