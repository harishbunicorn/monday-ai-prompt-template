import React, { useState, useCallback, useContext, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import useSWR from 'swr';

const Dropdown = dynamic(
    () => import('monday-ui-react-core').then((mod) => mod.Dropdown),
    {
        ssr: false,
    }
);

import { AppContext } from '@/components/context-provider/app-context-provider';
import TextInputWithTagsAndSend from '@/components/text-input-with-tags/text-input-with-tags';
import AiAppFooter from '@/components/ai-footer/ai-footer';
import SelectColumn from '@/components/select-column';
import { useAiApi, PromptsApiPayloadType } from '@/hooks/useAiApi';
import useBoardColumns, {
    mapBoardColumnsToDropdownOptions,
    mapBoardColumnsToTagsOptions,
} from '@/hooks/useBoardColumns';
import { useSuccessMessage } from '@/hooks/useSuccessMessage';
import classes from '@/assistants/boardAssistant/styles.module.scss';
import { executeMondayApiCall } from '@/helpers/monday-api-helpers';
import { Modes } from '@/types/layout-modes';

import { showErrorMessage } from '@/helpers/monday-actions';
import { replaceTagsWithColumnValues } from '@/helpers/tags-helpers';
import useBoardGroups, {
    getBoardGroups,
    mapBoardGroupsToDropdownOptions,
} from '@/hooks/useBoardGroups';
import SelectGroup from '@/components/select-group';
import useBoardGroupItems, {
    getBoardGroupsItems,
} from '@/hooks/useBoardGroupItems';
import { Button } from 'monday-ui-react-core';
import { IconButton } from 'monday-ui-react-core';
import {
    getCompletionsFromOpenAi,
    predict,
} from '@/app/api/openai/prompts/route';

type Props = {
    initialInput?: string;
};

type DropdownSelection = {
    id: string;
    value: string;
};

// @ts-ignore
async function getItemsAndColumnValues(selectedGroup, context, columnIds) {
    return await executeMondayApiCall(
        `query ($boardId:[Int], $columnIds:[String], $groupId: [String]) { boards (ids:$boardId) { groups(ids:$groupId) { items { id column_values (ids:$columnIds) { text id } } } } }`,
        {
            variables: {
                columnIds,
                boardId:
                    context?.iframeContext?.boardId ??
                    context?.iframeContext?.boardIds ??
                    [],
                groupId: selectedGroup,
            },
        }
    );
}

function getColumnIdsFromInputTags(input: string) {
    const findTaggedColumnsRegex = new RegExp('\\[\\[.*?\\]\\]', 'g');
    const taggedColumns = [...input.matchAll(findTaggedColumnsRegex)].map(
        (match) => {
            const data = JSON.parse(match[0])[0][0];
            const index = match.index;
            const { length } = match[0];
            const columnId = data.id;
            const columnTitle = data.value;
            return { columnId, columnTitle, length, index };
        }
    );
    var itemColumnValuesFromMonday;

    // get values of that column
    return taggedColumns.map((col) => col.columnId);
}

const BoardAssistant = ({ initialInput = '' }: Props): React.JSX.Element => {
    const context = useContext(AppContext);
    const sessionToken = context?.sessionToken ?? '';
    const [selectedGroup, setSelectedGroup] = useState<object>();
    const [groupItems, setGroupItems] = useState<object>();
    const [selectedItemValues, setSelectedItemValues] = useState<object>();
    console.log(
        '🚀 ~ file: board-assistant.tsx:81 ~ BoardAssistant ~ selectedItemValues:',
        selectedItemValues
    );
    console.log(
        '🚀 ~ file: board-assistant.tsx:80 ~ BoardAssistant ~ groupItems:',
        groupItems
    );
    const [selectedGroupItem, setSelectedGroupItem] = useState<object>();
    console.log(
        '🚀 ~ file: board-assistant.tsx:86 ~ BoardAssistant ~ selectedGroupItem:',
        selectedGroupItem
    );
    // const [groupsItemsForDropdownComponent,setGroupsItemsForDropdownComponent] = useState<object>();

    const boardColumns = useBoardColumns(context);
    const boardColumnsForDropdownComponent =
        mapBoardColumnsToDropdownOptions(boardColumns);

    const boardGroups = useBoardGroups(context);
    const boardGroupsForDropdownComponent =
        mapBoardGroupsToDropdownOptions(boardGroups) ?? [];

    const getGroupItems = async () => {
        const res = await getBoardGroupsItems(
            context?.iframeContext?.boardId,
            selectedGroup.value
        );
        console.log(
            '🚀 ~ file: board-assistant.tsx:94 ~ getGroupItems ~ res:',
            res
        );
        if (res.is_success) {
            const {
                data: { boards },
            } = res;
            const items = boards[0].groups[0].items;
            // console.log("🚀 ~ file: board-assistant.tsx:95 ~ getGroupItems ~ groups:", groups)
            // const [items] = groups;
            console.log(items);
            console.log(
                '🚀 ~ file: board-assistant.tsx:101 ~ getGroupItems ~ items:',
                items
            );
            setGroupItems(
                items.map((item: any) => ({ value: item.id, label: item.name }))
            );
            setSelectedItemValues(
                items.filter(
                    (item: any) => item.name === selectedGroupItem?.label
                )
            );
            // const [groups] = boards;
            // console.log(groups)

            // const [items] = groups;

            // const [board] = data;
        }
        console.log(res);
    };

    const getItemValues = async (selectedGroupItem) => {
        const res = await getBoardGroupsItems(
            context?.iframeContext?.boardId,
            selectedGroup.value
        );
        console.log(
            '🚀 ~ file: board-assistant.tsx:94 ~ getGroupItems ~ res:',
            res
        );
        if (res.is_success) {
            const {
                data: { boards },
            } = res;
            const items = boards[0].groups[0].items;
            // console.log("🚀 ~ file: board-assistant.tsx:95 ~ getGroupItems ~ groups:", groups)
            // const [items] = groups;
            console.log(items);
            console.log(
                '🚀 ~ file: board-assistant.tsx:101 ~ getGroupItems ~ items:',
                items
            );

            setSelectedItemValues(
                items.filter((item: any) => item.name === selectedGroup?.label)
            );
            // const [groups] = boards;
            // console.log(groups)

            // const [items] = groups;

            // const [board] = data;
        }
        console.log(res);
    };

    useEffect(() => {
        if (!selectedGroup) return;
        getGroupItems();
        // const res = useBoardGroupItems(context,selectedGroup?.value)
        console.log(selectedGroup);
    }, [selectedGroup]);

    function handleGroupItemSelect(e: DropdownSelection) {
        setSelectedGroupItem(e);
    }

    function handleGroupSelect(e: DropdownSelection) {
        setSelectedGroup(e);
    }

    const { data, error, mutate } = useSWR('/api/generate', postMessage, {
        revalidateOnFocus: false,
    });
    console.log('🚀 ~ file: board-assistant.tsx:208 ~ data:', data);

    const handleButtonClick = async () => {
        const data = selectedItemValues[0].column_values.map((item) => ({
            name: item.title,
            value: item.text,
        }));
        const locationItem = data.filter((item) => item.name === 'Location');
        console.log(
            '🚀 ~ file: board-assistant.tsx:204 ~ locationItem:',
            locationItem
        );
        console.log('🚀 ~ file: board-assistant.tsx:203 ~ data ~ data:', data);
        console.log(process.env.OPENAI_API_KEY);
        const prompt = `what is the current salary software engineer in ${locationItem[0].value} in one word?`;
        // postMessage(prompt)
        //     .then(() => {
        //         // Refresh the data by calling `mutate`
        //         mutate();
        //     })
        //     .catch((error) => {
        //         console.error('Error:', error);
        //     });
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        const result = await response.json();
        console.log(
            '🚀 ~ file: board-assistant.tsx:240 ~ handleButtonClick ~ result:',
            result
        );
        return result;
    };

    async function postMessage(message) {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: message }),
        });

        if (!response.ok) {
            throw new Error('Error posting message');
        }

        const data = await response.json();

        await executeMondayApiCall(
            `mutation ($column:String!,$boardId:Int!, $itemId:Int!, $value:String!) {
        change_simple_column_value (column_id:$column, board_id:$boardId, item_id:$itemId, value:$value) {
          id `,
            {
                variables: {
                    boardId: 1804130542,
                    column: 'numbers5',
                    itemId: 1804130594,
                    value: data.output,
                },
            }
        );
    }

    async function getCompetativeSalary() {
        const data = selectedItemValues[0].column_values.map((item) => ({
            name: item.title,
            value: item.text,
        }));
        const locationItem = data.filter((item) => item.name === 'Location');
        console.log(
            '🚀 ~ file: board-assistant.tsx:204 ~ locationItem:',
            locationItem
        );
        console.log('🚀 ~ file: board-assistant.tsx:203 ~ data ~ data:', data);
        console.log(process.env.OPENAI_API_KEY);
        const prompt = `what is the current salary software engineer in ${locationItem[0].value}?`;
        const response = await fetch('/api/generate', {
            // console.log('🚀 ~ file: board-assistant.tsx:208 ~ prompt:', prompt);
            method: 'POST',
            body: JSON.stringify({ prompt }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // const response = await predict(prompt);
        console.log(
            '🚀 ~ file: board-assistant.tsx:201 ~ getCompetativeSalary ~ response:',
            response
        );

        // return await executeMondayApiCall(
        //     `mutation ($column:String!,$boardId:Int!, $itemId:Int!, $value:String!) {
        // change_simple_column_value (column_id:$column, board_id:$boardId, item_id:$itemId, value:$value) {
        //   id `,
        //     {
        //         variables: {
        //             boardId: 1804130542,
        //             column: 'numbers5',
        //             itemId: 1804130594,
        //             value: '1500000',
        //         },
        //     }
        // );
    }

    return (
        <div className={classes.main}>
            <div className={classes.dropdownContainer}>
                <Dropdown
                    options={boardGroupsForDropdownComponent}
                    onChange={handleGroupSelect}
                    placeholder='Select a group'
                    size='small'
                />
                {selectedGroup && (
                    <Dropdown
                        options={groupItems}
                        onChange={handleGroupItemSelect}
                        placeholder={'Select an role'}
                        size='small'
                    />
                )}
                {/* <IconButton size="medium" icon={""} disabled={true}>Generate</IconButton> */}
                <Button
                    // disabled=true
                    onClick={handleButtonClick}
                    styles={{}}
                >
                    Get Competetive Salary
                </Button>
            </div>
            <div className={classes.footer}>
                <AiAppFooter />
            </div>
        </div>
    );
};

export default BoardAssistant;
