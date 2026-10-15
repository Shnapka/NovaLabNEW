"use client";
import type {
  GraphContent,
  MatchingContent,
  QuizContent,
  SimulationContent,
  SummaryContent,
} from "@/lib/modules/types";
import ModuleFrame, { type ModuleEvent } from "@/components/ModuleFrame";
import SummaryModule from "./SummaryModule";
import GraphModule from "./GraphModule";
import QuizModule from "./QuizModule";
import MatchingModule from "./MatchingModule";
import SimulationModule from "./SimulationModule";
import PracticeModule, { type PracticeContent } from "./PracticeModule";

export type RenderableModule = {
  type: string;
  title: string;
  content: unknown;
  buildUrl: string | null;
  config: unknown;
};

export default function ModuleRenderer({
  module: m,
  onEvent,
}: {
  module: RenderableModule;
  onEvent?: (e: ModuleEvent) => void;
}) {
  switch (m.type) {
    case "summary":
      return <SummaryModule content={m.content as SummaryContent} />;
    case "graph":
      return <GraphModule content={m.content as GraphContent} />;
    case "quiz":
      return <QuizModule content={m.content as QuizContent} onEvent={onEvent} />;
    case "matching":
      return <MatchingModule content={m.content as MatchingContent} onEvent={onEvent} />;
    case "practice":
      // Если подключён Unity-билд практики — показываем его, иначе встроенный веб-конструктор задач
      return m.buildUrl && !m.buildUrl.includes("/modules/placeholder/") ? (
        <ModuleFrame src={m.buildUrl} config={{ ...(m.config as object), topic: (m.content as PracticeContent).topic }} onEvent={onEvent} />
      ) : (
        <PracticeModule content={m.content as PracticeContent} onEvent={onEvent} />
      );
    case "simulation":
      return (
        <SimulationModule
          title={m.title}
          buildUrl={m.buildUrl}
          content={m.content as SimulationContent}
          config={m.config}
          onEvent={onEvent}
        />
      );
    default:
      return m.buildUrl ? (
        <ModuleFrame src={m.buildUrl} config={m.config} onEvent={onEvent} />
      ) : (
        <p className="text-gray-500">Неизвестный тип модуля: {m.type}</p>
      );
  }
}
