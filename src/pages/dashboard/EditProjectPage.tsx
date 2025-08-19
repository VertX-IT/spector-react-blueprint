/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById } from "@/lib/projectOperations";
import InlineBackButton from "@/components/ui/CustomButton";

const EditProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();

  useEffect(() => {
    // Automatically redirect to the form builder page
    if (projectId) {
      navigate(`/dashboard/projects/${projectId}/form-builder`, { replace: true });
    }
  }, [projectId, navigate]);

  // This component will redirect immediately, so we don't need to render anything
  return null;
};

export default EditProjectPage;
