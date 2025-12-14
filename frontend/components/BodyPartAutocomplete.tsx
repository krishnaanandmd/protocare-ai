"use client";

import { useState, useRef, useEffect } from "react";

type BodyPart = {
  id: string;
  name: string;
  description: string;
};

type BodyPartAutocompleteProps = {
  bodyParts: BodyPart[];
  selectedBodyPartId: string | null;
  onSelect: (bodyPartId: string | null) => void;
};

export function BodyPartAutocomplete({
  bodyParts,
  selectedBodyPartId,
  onSelect,
}: BodyPartAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedBodyPart = bodyParts.find((b) => b.id === selectedBodyPartId);

  // Filter body parts based on search term
  const filteredBodyParts = bodyParts.filter((bodyPart) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bodyPart.name.toLowerCase().includes(searchLower) ||
      bodyPart.description.toLowerCase().includes(searchLower)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update search term when a body part is selected from outside
  useEffect(() => {
    if (selectedBodyPart && !isOpen) {
      setSearchTerm(selectedBodyPart.name);
    }
  }, [selectedBodyPart, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    setHighlightedIndex(0);

    // Clear selection if input is cleared
    if (!value && selectedBodyPartId) {
      onSelect(null);
    }
  };

  const handleSelectBodyPart = (bodyPart: BodyPart) => {
    setSearchTerm(bodyPart.name);
    onSelect(bodyPart.id);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredBodyParts.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredBodyParts[highlightedIndex]) {
          handleSelectBodyPart(filteredBodyParts[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold text-slate-300 mb-2">
        Body Part / Joint
      </label>
      <input
        ref={inputRef}
        type="text"
        className="w-full rounded-xl bg-white/10 border-2 border-white/20 backdrop-blur-sm px-4 py-4 text-white text-lg placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
        placeholder="Search for a body part or joint..."
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {/* Dropdown menu with high z-index to appear above everything */}
      {isOpen && filteredBodyParts.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[100] max-h-80 overflow-y-auto rounded-xl bg-slate-900 border-2 border-white/20 shadow-2xl backdrop-blur-xl">
          {filteredBodyParts.map((bodyPart, index) => (
            <button
              key={bodyPart.id}
              type="button"
              className={`w-full px-4 py-4 text-left transition-colors border-b border-white/10 last:border-b-0 ${
                index === highlightedIndex
                  ? "bg-blue-500/30"
                  : "hover:bg-white/10"
              }`}
              onClick={() => handleSelectBodyPart(bodyPart)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="font-semibold text-white">{bodyPart.name}</div>
              <div className="text-sm text-slate-400 mt-1">
                {bodyPart.description}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchTerm && filteredBodyParts.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[100] rounded-xl bg-slate-900 border-2 border-white/20 shadow-2xl backdrop-blur-xl p-4">
          <p className="text-sm text-slate-400 text-center">
            No body parts found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
