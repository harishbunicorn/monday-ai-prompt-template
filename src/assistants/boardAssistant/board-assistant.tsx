import React, { useState, useCallback, useContext, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";

const Dropdown = dynamic(
  () => import("monday-ui-react-core").then((mod) => mod.Dropdown),
  {
    ssr: false,
  }
);

import { AppContext } from "@/components/context-provider/app-context-provider";
import TextInputWithTagsAndSend from "@/components/text-input-with-tags/text-input-with-tags";
import AiAppFooter from "@/components/ai-footer/ai-footer";
import SelectColumn from "@/components/select-column";
import { useAiApi, PromptsApiPayloadType } from "@/hooks/useAiApi";
import useBoardColumns, { mapBoardColumnsToDropdownOptions, mapBoardColumnsToTagsOptions } from "@/hooks/useBoardColumns";
import { useSuccessMessage } from "@/hooks/useSuccessMessage";
import classes from "@/assistants/boardAssistant/styles.module.scss";
import {
  executeMondayApiCall
} from "@/helpers/monday-api-helpers";
import { Modes } from "@/types/layout-modes";

import { showErrorMessage } from "@/helpers/monday-actions";
import { replaceTagsWithColumnValues } from "@/helpers/tags-helpers";
import useBoardGroups, {getBoardGroups, mapBoardGroupsToDropdownOptions} from "@/hooks/useBoardGroups";
import SelectGroup from "@/components/select-group";
import useBoardGroupItems, { getBoardGroupsItems } from "@/hooks/useBoardGroupItems";
import { Button } from "monday-ui-react-core";
import { IconButton } from "monday-ui-react-core";


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
      boardId: context?.iframeContext?.boardId ?? context?.iframeContext?.boardIds ?? [],
      groupId: selectedGroup,
    },
  }
)}

function getColumnIdsFromInputTags(input: string) {
  const findTaggedColumnsRegex = new RegExp("\\[\\[.*?\\]\\]", "g");
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

const BoardAssistant = ({ initialInput = "" }: Props): React.JSX.Element => {

  const context = useContext(AppContext);
  const sessionToken = context?.sessionToken ?? "";
  const [selectedGroup, setSelectedGroup] = useState<object>();
  const [groupItems,setGroupItems] = useState<object>()
  const [selectedGroupItem, setSelectedGroupItem] = useState<object>();
  // const [groupsItemsForDropdownComponent,setGroupsItemsForDropdownComponent] = useState<object>();

 
  
  const boardColumns = useBoardColumns(context);
  const boardColumnsForDropdownComponent = mapBoardColumnsToDropdownOptions(boardColumns);


  const boardGroups = useBoardGroups(context);
  const boardGroupsForDropdownComponent = mapBoardGroupsToDropdownOptions(boardGroups) ?? [];

  const getGroupItems = async () =>{
    const res = await getBoardGroupsItems(context?.iframeContext?.boardId,selectedGroup.value);
    if(res.is_success){
      const {data:{boards}} = res;
      const items = boards[0].groups[0].items;
      // console.log("🚀 ~ file: board-assistant.tsx:95 ~ getGroupItems ~ groups:", groups)
      // const [items] = groups;
      console.log(items)
      setGroupItems(items.map((item:any)=>({value:item.id,label:item.name})))
       // const [groups] = boards;
      // console.log(groups)

      // const [items] = groups;

      // const [board] = data;
    }
    console.log(res)
  }

  useEffect( ()=>{
    if(!selectedGroup) return;
    getGroupItems()
    // const res = useBoardGroupItems(context,selectedGroup?.value)
    console.log(selectedGroup)
  },[selectedGroup])


  function handleGroupItemSelect(e: DropdownSelection) {
    setSelectedGroupItem(e);
    }

  function handleGroupSelect(e: DropdownSelection) {
    setSelectedGroup(e);
  }



  return (
    <div className={classes.main}>
        <div className={classes.dropdownContainer}>
        <Dropdown
          options={boardGroupsForDropdownComponent}
          onChange={handleGroupSelect}
          placeholder="Select a group"
          size="small"
        />
        {selectedGroup && <Dropdown
          options={groupItems}
          onChange={handleGroupItemSelect}
          placeholder={"Select an role"}
          size="small"
          />
          }
          {/* <IconButton size="medium" icon={""} disabled={true}>Generate</IconButton> */}
          <Button
          // disabled=true

          styles={{

          }}>Get Competetive Salary</Button>
        </div>
      <div className={classes.footer}>
        <AiAppFooter />
      </div>
    </div>
  );
};

export default BoardAssistant;
