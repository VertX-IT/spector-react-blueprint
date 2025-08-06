import { useNavigate } from "react-router-dom";

const InlineBackButton = ({ path }) => {
    const navigate = useNavigate();

    const buttonStyle = {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        background: "linear-gradient(145deg, #4a5568, #2d3748)",
        border: "1px solid #1a202c",
        borderRadius: "6px",
        fontSize: "14px",
        color: "#e2e8f0",
        fontWeight: "500",
        letterSpacing: "0.3px",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
    };

    return (
        <>
            <style>
                {`
          .inline-back-button:hover {
            background: linear-gradient(145deg, #5a677a, #3b4658);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
          }

          .inline-back-button:active {
            background: linear-gradient(145deg, #3b4658, #2a3444);
            transform: translateY(0);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }
        `}
            </style>
            <button
                style={buttonStyle}
                className="inline-back-button"
                onClick={() => navigate(path)}
            >
                Back
            </button>
        </>
    );
};

export default InlineBackButton;