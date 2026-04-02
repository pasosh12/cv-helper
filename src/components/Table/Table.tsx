import { forwardRef } from "react";
import { ITechnologiesTableData } from "@/types/storeTypes";
import { capitalize } from "@/modules/utils/capitalize";
import { P, Td } from "./styles";
import { convertMonthsToYears } from "@/modules/utils/convertMonthsToYears";

type Props = {
  technologies: ITechnologiesTableData;
};

export const Table = forwardRef<HTMLTableElement, Props>(({ technologies }, ref) => {
  const sections = Object.keys(technologies);

  return (
    <table ref={ref}>
      <tbody>
        {sections.map((section) => (
          <tr key={section}>
            <Td $textAlign="left">
              <P $fontWeight="bold" $color="#c63031">
                {section && capitalize(section)}
              </P>
            </Td>
            <Td width="50%" $textAlign="left">
              {technologies[section].map((technology) => (
                <P $fontWeight="bold" $color="#353535" key={technology.name}>
                  {technology.name}
                </P>
              ))}
            </Td>
            <Td $textAlign="center">
              {technologies[section].map((technology) => (
                <P $color="#353535" key={technology.name}>
                  {convertMonthsToYears(technology.range)}
                </P>
              ))}
            </Td>
            <Td $textAlign="center">
              {technologies[section].map((technology) => (
                <P $color="#353535" key={technology.name}>
                  {technology.lastUsed}
                </P>
              ))}
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});
