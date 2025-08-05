import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { FormSection } from "./types";

interface SectionNavProps {
  sections: FormSection[];
  activeSection: number;
  setActiveSection: (index: number) => void;
  handleAddSection: () => void;
  handleRenameSection: (idx: number, newName: string) => void;
  handleRemoveSection: (idx: number) => void;
  editingSectionName: string;
  setEditingSectionName: (name: string) => void;
  isMobile: boolean;
}

const SectionNav: React.FC<SectionNavProps> = ({
  sections,
  activeSection,
  setActiveSection,
  handleAddSection,
  handleRenameSection,
  handleRemoveSection,
  editingSectionName,
  setEditingSectionName,
  isMobile,
}) => {
  const renderSectionsNav = () => (
    <div
      className={
        isMobile
          ? "flex items-center gap-3 flex-nowrap mb-4 overflow-x-auto pb-1 px-1"
          : "flex gap-2 flex-wrap mb-4"
      }
      style={isMobile ? { WebkitOverflowScrolling: "touch" } : undefined}
    >
      {sections.map((section, idx) => (
        <div
          key={section.id}
          className={
            isMobile
              ? `relative flex flex-col items-center justify-center bg-white rounded-lg drop-shadow-sm border min-w-[120px] px-3 py-1 mr-2 ${activeSection === idx
                ? "border-[#8B5CF6] shadow-md"
                : "border-gray-200"
              }`
              : "relative"
          }
          style={isMobile ? { minWidth: 130, marginRight: 8 } : undefined}
        >
          <Button
            size={isMobile ? "sm" : "default"}
            variant={activeSection === idx ? "default" : "outline"}
            className={
              isMobile
                ? `w-full justify-center rounded-lg text-sm font-semibold py-2 px-3 !shadow-none transition-colors ${activeSection === idx
                  ? "bg-[#8B5CF6] text-white"
                  : "bg-white text-[#8B5CF6] border border-[#DDD6FE]"
                }`
                : `rounded-full px-4 ${activeSection === idx ? "font-bold" : ""}`
            }
            style={isMobile ? { minHeight: 44, minWidth: 110 } : undefined}
            onClick={() => setActiveSection(idx)}
          >
            <span
              className={isMobile ? "truncate max-w-[72px] block" : ""}
              title={section.name}
            >
              {section.name}
            </span>
          </Button>
          {isMobile ? (
            <div className="flex justify-center gap-2 mt-1 w-full">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Rename section"
                onClick={() => setEditingSectionName(section.name)}
              >
                <Edit className="w-4 h-4 text-[#8B5CF6]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Remove section"
                onClick={() => handleRemoveSection(idx)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <>
              {activeSection === idx && (
                <button
                  title="Rename section"
                  className="absolute right-0 top-0 bg-transparent p-1"
                  onClick={() => setEditingSectionName(section.name)}
                  style={{ marginLeft: "0.2rem" }}
                >
                  <Edit className="w-4 h-4 text-[#9b87f5]" />
                </button>
              )}
              {sections.length > 1 && (
                <button
                  title="Remove section"
                  className="absolute right-0 top-7 bg-transparent text-red-500 p-1"
                  onClick={() => handleRemoveSection(idx)}
                  style={{ display: "block" }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ))}
      <Button
        onClick={handleAddSection}
        variant="ghost"
        className={
          isMobile
            ? "rounded-lg py-2 px-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white shadow border border-[#DDD6FE]"
            : "rounded-full px-3"
        }
        title="Add section"
      >
        <Plus className="h-5 w-5 text-[#8B5CF6]" />
        <span className="sr-only">Add section</span>
      </Button>
    </div>
  );

  const renderSectionRenameEditor = () => {
    if (!editingSectionName) return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
        <div className="bg-white rounded-md p-6">
          <h3 className="font-bold text-lg mb-2">Edit Section Name</h3>
          <input
            autoFocus
            value={editingSectionName}
            onChange={(e) => setEditingSectionName(e.target.value)}
            className="mb-3 w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                handleRenameSection(activeSection, editingSectionName);
                setEditingSectionName("");
              }}
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setEditingSectionName("")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderSectionsNav()}
      {renderSectionRenameEditor()}
    </>
  );
};

export default SectionNav;
