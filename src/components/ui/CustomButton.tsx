import { useNavigate } from "react-router-dom";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const InlineBackButton = ({ path }) => {
    const navigate = useNavigate();

    return (
        <Button
            variant="ghost"
            onClick={() => navigate(path)}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mr-auto"
        >
            <ArrowLeft className="h-5 w-5" />
        </Button>
    );
};

export default InlineBackButton;