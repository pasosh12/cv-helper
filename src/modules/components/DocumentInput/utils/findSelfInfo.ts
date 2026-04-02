import { normalizeString } from "@/modules/utils/normalizeString";
import { isNormalizedName } from "./helpers";
import { SelfInfo } from "@/types/storeTypes";

const infoIndexes = {
  name: 0,
  roles: 1,
  education: 3,
};

export const findSelfInfo = (htmlStr: string): SelfInfo => {
  const regExp = /<[^>]*>/gm;
  const arrWithCvStrings = htmlStr.split(regExp).filter((item) => item !== "");

  const indexOfFrontendSection = arrWithCvStrings.findIndex((item) =>
    isNormalizedName("programmingLanguages", normalizeString(item)),
  );
  const selfIntro = arrWithCvStrings.slice(0, indexOfFrontendSection);

  const name = selfIntro[infoIndexes.name];
  const roles = selfIntro[infoIndexes.roles];
  const education = selfIntro[infoIndexes.education];
  const selfIntroText = selfIntro.at(-1);

  return { name, roles, education, selfIntro: selfIntroText || "" };
};
