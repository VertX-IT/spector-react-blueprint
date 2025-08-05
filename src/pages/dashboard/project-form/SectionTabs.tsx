import React from "react";

interface SectionTabsProps {
  sections: { id: string; name: string }[];
  activeSectionIndex: number;
  setActiveSectionIndex: (idx: number) => void;
  completedSections: string[];
}

const SectionTabs: React.FC<SectionTabsProps> = ({
  sections,
  activeSectionIndex,
  setActiveSectionIndex,
  completedSections,
}) => {
  return (
    <div className="flex overflow-x-auto gap-2 pb-2 mb-2">
      {sections.map((section, idx) => (
        <button
          key={section.id}
          onClick={() => setActiveSectionIndex(idx)}
          className={`flex-shrink-0 px-4 py-2 rounded-lg border ${activeSectionIndex === idx
            ? "border-primary bg-primary/10 font-semibold"
            : "border-zinc-300 bg-white"
            }`}
        >
          {section.name}
          {completedSections.includes(section.id) && (
            <span className="ml-2 text-green-600 text-sm">✓</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default SectionTabs;
