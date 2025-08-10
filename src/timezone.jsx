import { useState } from "react";
import moment from "moment-timezone";
import { Action, ActionPanel, Clipboard, List } from "@raycast/api";
const Fuse = require('fuse.js')

const fuseOptions = {
    isCaseSensitive: false,
    shouldSort: true,
    threshold: 0.4,
    distance: 100,
    useExtendedSearch: false,
    ignoreLocation: false,
    keys: [
        "name",
        "description",
    ]
};

async function addToClipboard(text) {
    await Clipboard.copy(text);
}

export default function Command() {
    const [query, setQuery] = useState("");
    const timezones = moment.tz.names();
    const fuse = new Fuse(timezones, fuseOptions);
    const results = query ? fuse.search(query).map(result => result.item) : timezones;
    const handleSearch = (query) => {
        setQuery(query);
    };
    return (
        <List
            isLoading={!results}
            searchBarPlaceholder="Search timezones..."
            onSearchTextChange={handleSearch}
        >
            {results.map((timezone) => (
                <List.Item key={timezone} title={timezone} actions={
                    <ActionPanel>
                        <Action title="Copy to Clipboard" onAction={() => addToClipboard(timezone)} />
                    </ActionPanel>
                } />
            ))}
        </List>
    );

}