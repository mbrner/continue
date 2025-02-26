import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PersistedSessionInfo, SessionInfo } from "core";
import React, { Fragment, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { lightGray, secondaryDark, vscBackground } from "../components";
import HeaderButtonWithText from "../components/HeaderButtonWithText";
import useHistory from "../hooks/useHistory";
import { newSession } from "../redux/slices/stateSlice";
import { getFontSize } from "../util";

const Tr = styled.tr`
  &:hover {
    background-color: ${secondaryDark};
  }

  overflow-wrap: anywhere;

  border-bottom: 1px solid ${secondaryDark};
  border-top: 1px solid ${secondaryDark};
`;

const parseDate = (date: string): Date => {
  let dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date(parseInt(date));
  }
  return dateObj;
};

const SectionHeader = styled.tr`
  padding: 4px;
  padding-left: 16px;
  padding-right: 16px;
  background-color: ${secondaryDark};
  width: 100%;
  font-weight: bold;
  text-align: center;
  align-items: center;
  margin: 0;
  position: sticky;
  height: 1.5em;
`;

const TdDiv = styled.div`
  cursor: pointer;
  flex-grow: 1;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
`;

function TableRow({
  session,
  date,
  onDelete,
}: {
  session: SessionInfo;
  date: Date;
  onDelete: (sessionId: string) => void;
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const apiUrl = (window as any).serverUrl;
  const workspacePaths = (window as any).workspacePaths || [""];
  const [hovered, setHovered] = useState(false);

  const { saveSession, deleteSession, loadSession } = useHistory(dispatch);

  return (
    <td
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex justify-between items-center w-full">
        <TdDiv
          onClick={async () => {
            // Save current session
            saveSession();

            const json: PersistedSessionInfo = await loadSession(
              session.sessionId
            );
            dispatch(newSession(json));
            navigate("/");
          }}
        >
          <div className="text-md">{session.title}</div>
          <div className="text-gray-400">
            {date.toLocaleString("en-US", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
            {" | "}
            {lastPartOfPath(session.workspaceDirectory || "")}/
          </div>
        </TdDiv>

        {hovered && (
          <HeaderButtonWithText
            className="mr-2"
            text="Delete"
            onClick={async () => {
              deleteSession(session.sessionId);
              onDelete(session.sessionId);
            }}
          >
            <TrashIcon width="1.3em" height="1.3em" />
          </HeaderButtonWithText>
        )}
      </div>
    </td>
  );
}

function lastPartOfPath(path: string): string {
  const sep = path.includes("/") ? "/" : "\\";
  return path.split(sep).pop() || path;
}

function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [filteredAndSortedSessions, setFilteredAndSortedSessions] = useState<
    SessionInfo[]
  >([]);
  const apiUrl = (window as any).serverUrl;
  const workspacePaths = (window as any).workspacePaths || [];

  const deleteSessionInUI = async (sessionId: string) => {
    setSessions((prev) =>
      prev.filter((session) => session.sessionId !== sessionId)
    );
  };

  const [filteringByWorkspace, setFilteringByWorkspace] = useState(false);
  const stickyHistoryHeaderRef = React.useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const dispatch = useDispatch();
  const { getHistory } = useHistory(dispatch);

  useEffect(() => {
    const fetchSessions = async () => {
      const sessions = await getHistory();
      setSessions(sessions);
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    setFilteredAndSortedSessions(
      sessions
        .filter((session) => {
          if (
            !filteringByWorkspace ||
            typeof workspacePaths === "undefined" ||
            typeof session.workspaceDirectory === "undefined"
          ) {
            return true;
          }
          return workspacePaths.includes(session.workspaceDirectory);
        })
        .sort(
          (a, b) =>
            parseDate(b.dateCreated).getTime() -
            parseDate(a.dateCreated).getTime()
        )
    );
  }, [filteringByWorkspace, sessions]);

  useEffect(() => {
    setHeaderHeight(stickyHistoryHeaderRef.current?.clientHeight || 100);
  }, [stickyHistoryHeaderRef.current]);

  const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const lastWeek = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const lastMonth = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const earlier = new Date(0);

  return (
    <div className="overflow-y-scroll" style={{ fontSize: getFontSize() }}>
      <div
        ref={stickyHistoryHeaderRef}
        className="sticky top-0"
        style={{ backgroundColor: vscBackground }}
      >
        <div
          className="items-center flex m-0 p-0"
          style={{
            borderBottom: `0.5px solid ${lightGray}`,
          }}
        >
          <ArrowLeftIcon
            width="1.2em"
            height="1.2em"
            onClick={() => navigate("/")}
            className="inline-block ml-4 cursor-pointer"
          />
          <h3 className="text-lg font-bold m-2 inline-block">History</h3>
        </div>
        {/* {workspacePaths && workspacePaths.length > 0 && (
          <CheckDiv
            checked={filteringByWorkspace}
            onClick={() => setFilteringByWorkspace((prev) => !prev)}
            title={`Show only sessions from ${lastPartOfPath(
              workspacePaths[workspacePaths.length - 1]
            )}/`}
          />
        )} */}
      </div>

      {sessions.filter((session) => {
        if (
          !filteringByWorkspace ||
          typeof workspacePaths === "undefined" ||
          typeof session.workspaceDirectory === "undefined"
        ) {
          return true;
        }
        return workspacePaths.includes(session.workspaceDirectory);
      }).length === 0 && (
        <div className="text-center m-4">
          No past sessions found. To start a new session, either click the "+"
          button or use the keyboard shortcut: <b>Option + Command + N</b>
        </div>
      )}

      <div>
        <table className="w-full border-spacing-0 border-collapse">
          <tbody>
            {filteredAndSortedSessions.map((session, index) => {
              const prevDate =
                index > 0
                  ? parseDate(filteredAndSortedSessions[index - 1].dateCreated)
                  : earlier;
              const date = parseDate(session.dateCreated);
              return (
                <Fragment key={index}>
                  {index === 0 && date > yesterday && (
                    <SectionHeader style={{ top: `${headerHeight - 1}px` }}>
                      Today
                    </SectionHeader>
                  )}
                  {date < yesterday &&
                    date > lastWeek &&
                    prevDate > yesterday && (
                      <SectionHeader style={{ top: `${headerHeight - 1}px` }}>
                        This Week
                      </SectionHeader>
                    )}
                  {date < lastWeek &&
                    date > lastMonth &&
                    prevDate > lastWeek && (
                      <SectionHeader style={{ top: `${headerHeight - 1}px` }}>
                        This Month
                      </SectionHeader>
                    )}

                  <Tr key={index}>
                    <TableRow
                      session={session}
                      date={date}
                      onDelete={() => deleteSessionInUI(session.sessionId)}
                    ></TableRow>
                  </Tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <br />
        <i className="text-sm ml-4">
          All session data is saved in ~/.continue/sessions
        </i>
      </div>
    </div>
  );
}

export default History;
