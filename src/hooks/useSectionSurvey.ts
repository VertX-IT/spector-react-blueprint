
import { useState } from "react";

export interface SectionSurveyState {
  [sectionId: string]: Record<string, any>;
}

export function useSectionSurvey(sectionIds: string[]) {
  const [sectionData, setSectionData] = useState<SectionSurveyState>({});
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  const submitSection = (sectionId: string, data: Record<string, any>) => {
    setSectionData(prev => ({ ...prev, [sectionId]: data }));
    if (!completedSections.includes(sectionId)) {
      setCompletedSections(prev => [...prev, sectionId]);
    }
  };

  const endSurvey = () => {
    setSurveyCompleted(true);
  };

  const resetSurvey = () => {
    setSectionData({});
    setCompletedSections([]);
    setSurveyCompleted(false);
  };

  return {
    sectionData,
    completedSections,
    surveyCompleted,
    submitSection,
    endSurvey,
    resetSurvey,
  };
}
