import React from "react";
import { Section } from "./types";

interface SectionTabsProps {
  sections: Section[];
  activeSectionIndex: number;
  setActiveSectionIndex: (index: number) => void;
  completedSections: string[];
  isDesigner: boolean;
  isCollector: boolean;
  isEditMode: boolean;
  handleRenameSection: (sectionId: string, newName: string) => void;
  handleDeleteSection: (sectionId: string) => void;
  handleUpdateFieldName: (fieldId: string, newName: string) => void;
  handleToggleRequired: (fieldId: string) => void;
}

const SectionTabs: React.FC<SectionTabsProps> = ({
  sections,
  activeSectionIndex,
  setActiveSectionIndex,
  completedSections,
  isDesigner,
  isCollector,
  isEditMode,
  handleRenameSection,
  handleDeleteSection,
  handleUpdateFieldName,
  handleToggleRequired,
}) => {
  if (isDesigner) {
    return (
      <div className="space-y-4">
        {sections
          .sort((a, b) => a.order - b.order)
          .map((section, idx) => (
            <div key={section.id} className="relative">
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <input
                    value={section.name}
                    onChange={(e) =>
                      handleRenameSection(section.id, e.target.value)
                    }
                    className="w-full border p-1 rounded"
                  />
                ) : (
                  <h3 className="text-lg font-medium">{section.name}</h3>
                )}
                {isEditMode && (
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <hr className="my-2" />
              <div className="ml-4 space-y-2">
                {section.fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2">
                    {isEditMode ? (
                      <input
                        value={field.label || field.name || ""}
                        onChange={(e) =>
                          handleUpdateFieldName(field.id, e.target.value)
                        }
                        className="flex-1 border p-1 rounded text-sm"
                      />
                    ) : (
                      <span className="text-sm">{field.label || field.name}</span>
                    )}
                    {isEditMode && (
                      <button
                        onClick={() => handleToggleRequired(field.id)}
                        className={`text-xs px-2 py-1 rounded ${
                          field.required
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {field.required ? "Required" : "Optional"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  }

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
