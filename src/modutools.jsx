import { Action, ActionPanel, List, LocalStorage } from "@raycast/api";
import { useEffect, useState } from "react";
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

export default function Command() {
    const [categories, setCategories] = useState([]);
    const [tools, setTools] = useState([]);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const response = await fetch("https://beta.modu.tools/api/tools");
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        if (categories) {
            const allTools = Object.entries(categories).flatMap(([category, tools]) =>
                tools.map(tool => ({ ...tool, category }))
            );
            setTools(allTools);
            setResults(allTools);
        }
    }, [categories]);

    const handleSearch = (query) => {
        setSearch(query);
        if (query.length === 0) {
            setResults(tools);
            return;
        }

        const fuse = new Fuse(tools, fuseOptions);

        var filteredResults = tools.filter((tool) =>
            tool.name.toLowerCase().includes(query.toLowerCase()) ||
            tool.description.toLowerCase().includes(query.toLowerCase())
        );
        if (filteredResults.length === 0) {
            filteredResults = fuse.search(query).map(result => result.item);
        }

        setResults(filteredResults);
    };

    return (
        <List
            isLoading={loading}
            searchBarPlaceholder="Search tools..."
            onSearchTextChange={handleSearch}
        >
            {results.map((tool) => (
                <List.Item
                    key={tool.name}
                    title={tool.name}
                    subtitle={tool.description}
                    actions={
                        <ActionPanel>
                            <Action.OpenInBrowser url={'https://beta.modu.tools' + tool.link + '?utm_source=raycast'} />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}
