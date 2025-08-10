import { Action, ActionPanel, Detail, Form, showToast, Toast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";
import { useState } from "react";

export default function Command() {
    const { handleSubmit, itemProps } = useForm({
        onSubmit(values) {
            handleConvert(values.colour);
        },
        validation: {
            colour: FormValidation.Required,
        },
    });
    const [converted, setConverted] = useState(false);
    const [convertedColour, setConvertedColour] = useState({});
    const handleConvert = (colour) => {
        setConverted(true);
        setConvertedColour(colour);
    };
    return (
        <>
            {converted && (

                <Detail>
                    <Detail.Metadata>
                        <Detail.Metadata.Label title="Input Colour" text={itemProps.colour.value} />
                        <Detail.Metadata.Label title="Converted Colour" text={convertedColour} />
                    </Detail.Metadata>
                </Detail>
            )}
            {!converted && (
                <Form
                    actions={
                        <ActionPanel>
                            <Action.SubmitForm title="Convert" onSubmit={handleSubmit} />
                        </ActionPanel>
                    }
                >
                    <Form.TextField title="Input Colour" placeholder="#FF6201" {...itemProps.colour} />
                </Form >
            )}
        </>
    );
}