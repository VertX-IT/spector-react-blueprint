
import React, { useState, useEffect } from 'react';
import { sriLankaProvinces, getDistrictsForProvince } from '@/utils/locationData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter location',
  className
}) => {
  const [selectedTab, setSelectedTab] = useState<string>("dropdown");
  const [manualLocation, setManualLocation] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // Initialize values from passed value prop
  useEffect(() => {
    if (!value) return;
    
    try {
      // Check if the value is in JSON format (from dropdown selection)
      const parsedValue = JSON.parse(value);
      if (parsedValue.province && parsedValue.district) {
        setSelectedTab("dropdown");
        setSelectedProvince(parsedValue.province);
        setSelectedDistrict(parsedValue.district);
      } else {
        setSelectedTab("manual");
        setManualLocation(value);
      }
    } catch (e) {
      // If it's not valid JSON, treat it as manual entry
      setSelectedTab("manual");
      setManualLocation(value);
    }
  }, []);

  // Update districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      setAvailableDistricts(getDistrictsForProvince(selectedProvince));
      setSelectedDistrict(""); // Reset district when province changes
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedProvince]);

  // Update the parent component with the new value
  useEffect(() => {
    if (selectedTab === "manual") {
      onChange(manualLocation);
    } else if (selectedProvince && selectedDistrict) {
      const locationValue = JSON.stringify({
        province: selectedProvince,
        district: selectedDistrict
      });
      onChange(locationValue);
    }
  }, [selectedTab, manualLocation, selectedProvince, selectedDistrict, onChange]);

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    // Reset values when switching tabs
    if (tab === "manual") {
      setManualLocation("");
      onChange("");
    } else {
      setSelectedProvince("");
      setSelectedDistrict("");
      onChange("");
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dropdown" disabled={disabled}>Province/District</TabsTrigger>
          <TabsTrigger value="manual" disabled={disabled}>Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="dropdown" className="space-y-3 pt-2">
          <div className="space-y-2">
            <Label>Province</Label>
            <Select 
              value={selectedProvince} 
              onValueChange={setSelectedProvince}
              disabled={disabled}
            >
              <SelectTrigger className={`${disabled ? 'bg-gray-100' : ''}`}>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {sriLankaProvinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>District</Label>
            <Select 
              value={selectedDistrict} 
              onValueChange={setSelectedDistrict}
              disabled={disabled || !selectedProvince}
            >
              <SelectTrigger className={`${disabled || !selectedProvince ? 'bg-gray-100' : ''}`}>
                <SelectValue placeholder={selectedProvince ? "Select district" : "Select province first"} />
              </SelectTrigger>
              <SelectContent>
                {availableDistricts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="pt-2">
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className={`${disabled ? 'bg-gray-100' : ''}`}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
