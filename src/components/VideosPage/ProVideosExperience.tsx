import type { Videos } from "@prisma/client";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiLock,
  FiPauseCircle,
  FiPlayCircle,
  FiSearch,
} from "react-icons/fi";
import { RiCustomerService2Line } from "react-icons/ri";
import styles from "../../styles/VideosPro.module.scss";
import { modules as legacyModules } from "../../utils/videos";

type Level = "Iniciante" | "Intermediário" | "Avançado";
type LessonFilter = "all" | "unwatched" | "completed";
type ContentTab = "overview" | "materials";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  level: Level;
  description: string;
  thumbnail: string;
  locked?: boolean;
  materials: string[];
  youtubeId?: string;
}

interface ModuleData {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface ProVideosExperienceProps {
  videos: Videos[];
  isLoading?: boolean;
  initialVideoId?: string;
}

const MODULE_NAME_POOL = [
  "Fundamentos",
  "Operação",
  "Escala",
  "Execução Avançada",
  "Bônus",
];

function sanitizeYoutubeId(value?: string | null) {
  if (!value) return "";
  const raw = value.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{6,})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1];
  }

  if (/^[a-zA-Z0-9_-]{6,}$/.test(raw)) return raw;
  return "";
}

function formatDurationByIndex(index: number) {
  const minutes = 8 + ((index * 3 + 7) % 15);
  const seconds = 10 + ((index * 11 + 13) % 49);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function levelByIndex(index: number): Level {
  const levels = ["Iniciante", "Intermediário", "Avançado"] as const;
  const safeIndex = ((index % levels.length) + levels.length) % levels.length;
  return levels[safeIndex] ?? "Iniciante";
}

function cleanLessonTitle(title: string) {
  return title
    .replace(/^m[oó]dulo\s*\d+\s*[-:–]\s*/i, "")
    .replace(/^aula\s*\d+\s*[-:–]\s*/i, "")
    .trim();
}

function normalizeLineBreaks(text: string) {
  return text.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

function buildOverviewText(lesson: Lesson | null) {
  if (!lesson) {
    return "Selecione uma aula para visualizar o resumo, objetivos e materiais recomendados.";
  }

  return normalizeLineBreaks(lesson.description || "").trim();
}

function normalizeHref(rawUrl: string) {
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `https://${rawUrl}`;
}

function splitUrlAndSuffix(token: string) {
  const match = token.match(/^(.*?)([),.;!?]+)?$/);
  if (!match) return { url: token, suffix: "" };
  return { url: match[1] || token, suffix: match[2] || "" };
}

function renderTextWithLinks(text: string) {
  const lines = text.split("\n");
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

  return lines.map((line, lineIndex) => {
    const parts = line.split(urlRegex);

    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parts.map((part, partIndex) => {
          if (!part) return null;

          const isUrl = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i.test(part);
          if (!isUrl) {
            return (
              <React.Fragment key={`text-${lineIndex}-${partIndex}`}>
                {part}
              </React.Fragment>
            );
          }

          const { url, suffix } = splitUrlAndSuffix(part);
          return (
            <React.Fragment key={`link-${lineIndex}-${partIndex}`}>
              <a
                href={normalizeHref(url)}
                target="_blank"
                rel="noreferrer"
                className={styles.overviewLink}
              >
                {url}
              </a>
              {suffix}
            </React.Fragment>
          );
        })}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

function modulePrefix(moduleTitle?: string | null) {
  if (!moduleTitle) return "";
  const match = moduleTitle.match(/m[oó]dulo\s*\d+/i);
  return match?.[0] || "";
}

function extractLegacyVideoId(url: string) {
  const parts = url.split("/videos/");
  return parts[1]?.trim() || "";
}

function toLesson(
  video: Videos,
  index: number,
  fallbackThumbnail?: string
): Lesson {
  const youtubeId = sanitizeYoutubeId(video.idYoutube);
  const thumbnail = youtubeId
    ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
    : fallbackThumbnail || "/images/bannersModulos/centralRecursos.png";

  const materials = video.additionalMaterial
    ? video.additionalMaterial
        .split(/\n|,|;/g)
        .map((item) => item.trim())
        .filter(Boolean)
    : ["Material complementar em breve."];

  return {
    id: video.id,
    title: cleanLessonTitle(video.title),
    duration: formatDurationByIndex(index),
    level: levelByIndex(index),
    description: video.description || "Descrição não informada.",
    thumbnail,
    materials,
    locked: false,
    youtubeId,
  };
}

function toModulesByLegacyOrder(videos: Videos[]) {
  const byId = new Map(videos.map((video) => [video.id, video]));
  const usedIds = new Set<string>();
  let index = 0;

  const orderedModules: ModuleData[] = legacyModules
    .map((legacyModule) => {
      const lessons = legacyModule.videos
        .map((legacyVideo) => {
          const legacyId = extractLegacyVideoId(legacyVideo.url);
          const matched = byId.get(legacyId);
          if (!matched) return null;

          usedIds.add(matched.id);
          const lesson = toLesson(matched, index, legacyVideo.thumbnail);
          index += 1;
          return lesson;
        })
        .filter((lesson): lesson is Lesson => Boolean(lesson));

      return {
        id: `legacy-module-${legacyModule.id}`,
        title: legacyModule.moduleTitle.trim(),
        lessons,
      };
    })
    .filter((moduleItem) => moduleItem.lessons.length > 0);

  const remaining = videos.filter((video) => !usedIds.has(video.id));
  if (remaining.length > 0) {
    orderedModules.push({
      id: "legacy-module-extra",
      title: "Módulo Extra - Arbitragem SPOT-SPOT",
      lessons: remaining.map((video) => {
        const lesson = toLesson(video, index);
        index += 1;
        return lesson;
      }),
    });
  }

  if (orderedModules.length > 0) return orderedModules;

  const fallbackLessons = videos.map((video) => {
    const lesson = toLesson(video, index);
    index += 1;
    return lesson;
  });

  const fallbackModules: ModuleData[] = [];
  const chunkSize = 6;
  for (let i = 0; i < fallbackLessons.length; i += chunkSize) {
    const chunk = fallbackLessons.slice(i, i + chunkSize);
    const moduleIndex = Math.floor(i / chunkSize);
    fallbackModules.push({
      id: `module-${moduleIndex + 1}`,
      title: `Módulo ${moduleIndex + 1} - ${
        MODULE_NAME_POOL[moduleIndex] || "Conteúdo"
      }`,
      lessons: chunk,
    });
  }

  return fallbackModules;
}

const EMPTY_MOCK_MODULES: ModuleData[] = [
  {
    id: "module-1",
    title: "Módulo 1 - Fundamentos",
    lessons: [
      {
        id: "mock-1",
        title: "Boas-vindas e visão do método",
        duration: "08:24",
        level: "Iniciante",
        description: "Introdução da metodologia e estrutura da área de aulas.",
        thumbnail: "/images/bannersModulos/centralRecursos.png",
        materials: ["Guia inicial.pdf"],
      },
      {
        id: "mock-2",
        title: "Setup de ambiente",
        duration: "12:10",
        level: "Iniciante",
        description: "Configuração recomendada para começar com consistência.",
        thumbnail: "/images/bannersModulos/centralRecursos.png",
        materials: ["Checklist setup.txt"],
      },
      {
        id: "mock-3",
        title: "Aula bônus (bloqueada)",
        duration: "16:30",
        level: "Intermediário",
        description:
          "Conteúdo bloqueado para simular estado de aula indisponível.",
        thumbnail: "/images/bannersModulos/centralRecursos.png",
        materials: ["Bônus.pdf"],
        locked: true,
      },
    ],
  },
];

export function ProVideosExperience({
  videos,
  isLoading = false,
  initialVideoId,
}: ProVideosExperienceProps) {
  const modules = useMemo(() => {
    if (!videos.length) return EMPTY_MOCK_MODULES;
    return toModulesByLegacyOrder(videos);
  }, [videos]);

  const firstAvailableModule = modules[0] || null;
  const firstAvailableLesson = firstAvailableModule?.lessons[0] || null;

  const findLessonById = useCallback(
    (lessonId: string) => {
      for (const moduleItem of modules) {
        const lesson = moduleItem.lessons.find(
          (current) => current.id === lessonId
        );
        if (lesson) return { module: moduleItem, lesson };
      }
      return null;
    },
    [modules]
  );

  const initialSelection = useMemo(() => {
    if (initialVideoId) {
      const byId = findLessonById(initialVideoId);
      if (byId) return byId;
    }
    if (firstAvailableModule && firstAvailableLesson) {
      return { module: firstAvailableModule, lesson: firstAvailableLesson };
    }
    return null;
  }, [
    findLessonById,
    firstAvailableLesson,
    firstAvailableModule,
    initialVideoId,
  ]);

  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    initialSelection?.module.id || ""
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    initialSelection?.lesson.id || ""
  );
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<LessonFilter>("all");
  const [openModuleId, setOpenModuleId] = useState<string>(
    initialSelection?.module.id || ""
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>("overview");
  const [recentlyCompletedLessonId, setRecentlyCompletedLessonId] =
    useState("");

  useEffect(() => {
    if (!initialVideoId) return;
    const found = findLessonById(initialVideoId);
    if (!found) return;
    setSelectedModuleId(found.module.id);
    setSelectedLessonId(found.lesson.id);
    setOpenModuleId(found.module.id);
  }, [findLessonById, initialVideoId]);

  const selectedModule = useMemo(
    () =>
      modules.find((moduleItem) => moduleItem.id === selectedModuleId) ||
      firstAvailableModule ||
      null,
    [firstAvailableModule, modules, selectedModuleId]
  );

  const selectedLesson = useMemo(() => {
    if (!selectedModule) return null;
    return (
      selectedModule.lessons.find((lesson) => lesson.id === selectedLessonId) ||
      selectedModule.lessons[0] ||
      null
    );
  }, [selectedLessonId, selectedModule]);

  const allUnlockedLessonIds = useMemo(
    () =>
      modules.flatMap((moduleItem) =>
        moduleItem.lessons
          .filter((lesson) => !lesson.locked)
          .map((lesson) => lesson.id)
      ),
    [modules]
  );

  const continueLessonId = useMemo(() => {
    const lastSeenUnlocked = [...watchHistory]
      .reverse()
      .find((lessonId) => allUnlockedLessonIds.includes(lessonId));
    if (lastSeenUnlocked) return lastSeenUnlocked;
    return (
      allUnlockedLessonIds.find(
        (lessonId) => !completedLessonIds.includes(lessonId)
      ) ||
      allUnlockedLessonIds[0] ||
      ""
    );
  }, [allUnlockedLessonIds, completedLessonIds, watchHistory]);

  const overallCourseProgress = useMemo(() => {
    const total = allUnlockedLessonIds.length;
    const done = allUnlockedLessonIds.filter((lessonId) =>
      completedLessonIds.includes(lessonId)
    ).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [allUnlockedLessonIds, completedLessonIds]);

  const selectedModuleProgress = useMemo(() => {
    if (!selectedModule) return { done: 0, total: 0, percent: 0 };
    const total = selectedModule.lessons.length;
    const done = selectedModule.lessons.filter((lesson) =>
      completedLessonIds.includes(lesson.id)
    ).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [completedLessonIds, selectedModule]);

  const nextLessonInModule = useMemo(() => {
    if (!selectedModule) return null;
    const unlockedLessons = selectedModule.lessons.filter(
      (lesson) => !lesson.locked
    );
    if (!unlockedLessons.length) return null;

    const currentIndex = unlockedLessons.findIndex(
      (lesson) => lesson.id === selectedLessonId
    );

    if (currentIndex >= 0 && currentIndex < unlockedLessons.length - 1) {
      return unlockedLessons[currentIndex + 1];
    }

    const firstPending = unlockedLessons.find(
      (lesson) => !completedLessonIds.includes(lesson.id)
    );
    return firstPending || unlockedLessons[0];
  }, [completedLessonIds, selectedLessonId, selectedModule]);

  const filteredLessons = (moduleItem: ModuleData) => {
    return moduleItem.lessons.filter((lesson) => {
      const matchesSearch = lesson.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const isCompleted = completedLessonIds.includes(lesson.id);

      if (!matchesSearch) return false;
      if (filter === "completed") return isCompleted;
      if (filter === "unwatched") return !isCompleted && !lesson.locked;
      return true;
    });
  };

  const handleSelectLesson = (moduleItem: ModuleData, lesson: Lesson) => {
    if (lesson.locked) return;
    setSelectedModuleId(moduleItem.id);
    setSelectedLessonId(lesson.id);
    setWatchHistory((prev) => [
      ...prev.filter((id) => id !== lesson.id),
      lesson.id,
    ]);
    setOpenModuleId(moduleItem.id);
    setIsPlaying(false);
  };

  const goToContinue = () => {
    if (!continueLessonId) return;
    const found = findLessonById(continueLessonId);
    if (!found) return;
    handleSelectLesson(found.module, found.lesson);
  };

  const getCurrentUnlockedIndex = () =>
    selectedLesson ? allUnlockedLessonIds.indexOf(selectedLesson.id) : -1;

  const goToNextLesson = () => {
    const currentIndex = getCurrentUnlockedIndex();
    const nextId = allUnlockedLessonIds[currentIndex + 1];
    if (!nextId) return;
    const found = findLessonById(nextId);
    if (!found) return;
    handleSelectLesson(found.module, found.lesson);
  };

  const goToPreviousLesson = () => {
    const currentIndex = getCurrentUnlockedIndex();
    const previousId = allUnlockedLessonIds[currentIndex - 1];
    if (!previousId) return;
    const found = findLessonById(previousId);
    if (!found) return;
    handleSelectLesson(found.module, found.lesson);
  };

  const toggleCompleted = () => {
    if (!selectedLesson || selectedLesson.locked) return;
    const willMarkCompleted = !completedLessonIds.includes(selectedLesson.id);
    setCompletedLessonIds((prev) =>
      prev.includes(selectedLesson.id)
        ? prev.filter((id) => id !== selectedLesson.id)
        : [...prev, selectedLesson.id]
    );
    if (willMarkCompleted) {
      setRecentlyCompletedLessonId(selectedLesson.id);
      window.setTimeout(() => setRecentlyCompletedLessonId(""), 850);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isTyping) return;

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        goToNextLesson();
      }
      if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        goToPreviousLesson();
      }
      if (event.code === "Space") {
        event.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const sidebarHasAnyLesson = modules.some(
    (moduleItem) => filteredLessons(moduleItem).length > 0
  );

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden />
      <div className={styles.container}>
        <section className={styles.pageTopbar}>
          <div>
            <h1 className={styles.pageTitle}>Aulas</h1>
            <p className={styles.breadcrumb}>
              Home <FiChevronRight />
              Aulas <FiChevronRight />
              {selectedModule?.title || "Módulo"} <FiChevronRight />
              {selectedLesson?.title || "Aula"}
            </p>
            <div className={styles.courseMiniProgress}>
              <div className={styles.courseMiniHeader}>
                <span>Progresso geral</span>
                <strong>{overallCourseProgress.percent}%</strong>
              </div>
              <div className={styles.courseMiniTrack}>
                <div
                  className={styles.courseMiniValue}
                  style={{ width: `${overallCourseProgress.percent}%` }}
                />
              </div>
            </div>
          </div>
          <div className={styles.topbarActions}>
            <button className={styles.ghostButton} type="button">
              <RiCustomerService2Line />
              Suporte
            </button>
            <button
              className={styles.avatarButton}
              type="button"
              aria-label="Perfil"
            >
              NG
            </button>
          </div>
        </section>

        {isLoading ? (
          <section className={styles.loadingGrid}>
            <div className={styles.skeletonCard}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonPlayer} />
              <div className={styles.skeletonRow} />
            </div>
            <div className={styles.skeletonCard}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonList} />
            </div>
          </section>
        ) : (
          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <VideoPlayerCard
                key={selectedLesson?.id || "no-lesson"}
                lesson={selectedLesson}
                moduleTitle={selectedModule?.title}
                isCompleted={
                  selectedLesson
                    ? completedLessonIds.includes(selectedLesson.id)
                    : false
                }
                completionFeedback={
                  selectedLesson?.id === recentlyCompletedLessonId
                }
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying((prev) => !prev)}
                onContinue={goToContinue}
                onToggleComplete={toggleCompleted}
                onNext={goToNextLesson}
              />

              <section className={styles.tabsCard}>
                <div
                  className={styles.tabsHeader}
                  role="tablist"
                  aria-label="Conteúdo da aula"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "overview"}
                    className={`${styles.tabButton} ${
                      activeTab === "overview" ? styles.tabButtonActive : ""
                    }`}
                    onClick={() => setActiveTab("overview")}
                  >
                    Visão geral
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "materials"}
                    className={`${styles.tabButton} ${
                      activeTab === "materials" ? styles.tabButtonActive : ""
                    }`}
                    onClick={() => setActiveTab("materials")}
                  >
                    Materiais
                  </button>
                </div>

                <div className={styles.tabContent}>
                  {activeTab === "overview" && (
                    <div className={styles.overviewText}>
                      {renderTextWithLinks(buildOverviewText(selectedLesson))}
                    </div>
                  )}

                  {activeTab === "materials" && (
                    <div className={styles.materialList}>
                      {(selectedLesson?.materials || []).map((material) => (
                        <div key={material} className={styles.materialItem}>
                          {material}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className={styles.sidebarColumn}>
              <ProgressCard
                moduleTitle={selectedModule?.title}
                done={selectedModuleProgress.done}
                total={selectedModuleProgress.total}
                percent={selectedModuleProgress.percent}
                nextLessonTitle={nextLessonInModule?.title}
              />

              <section className={styles.sidebarCard}>
                <div className={styles.searchWrapper}>
                  <FiSearch />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar aula"
                    aria-label="Buscar aula"
                  />
                </div>

                <div className={styles.filterRow}>
                  <FilterButton
                    label="Todas"
                    active={filter === "all"}
                    onClick={() => setFilter("all")}
                  />
                  <FilterButton
                    label="Não assistidas"
                    active={filter === "unwatched"}
                    onClick={() => setFilter("unwatched")}
                  />
                  <FilterButton
                    label="Concluídas"
                    active={filter === "completed"}
                    onClick={() => setFilter("completed")}
                  />
                </div>

                {!sidebarHasAnyLesson ? (
                  <div className={styles.emptyState}>
                    Nenhuma aula encontrada para esta busca/filtro.
                  </div>
                ) : (
                  <div className={styles.accordionRoot}>
                    {modules.map((moduleItem) => (
                      <ModuleAccordion
                        key={moduleItem.id}
                        module={moduleItem}
                        lessons={filteredLessons(moduleItem)}
                        isOpen={openModuleId === moduleItem.id}
                        selectedLessonId={selectedLessonId}
                        completedLessonIds={completedLessonIds}
                        onToggle={() =>
                          setOpenModuleId((current) =>
                            current === moduleItem.id ? "" : moduleItem.id
                          )
                        }
                        onSelectLesson={(lesson) =>
                          handleSelectLesson(moduleItem, lesson)
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </section>
        )}

        <footer className={styles.shortcutsFooter}>
          <span>Atalhos:</span> <strong>N</strong> próxima, <strong>P</strong>{" "}
          anterior, <strong>Espaço</strong> play/pause.
        </footer>
      </div>
    </main>
  );
}

interface VideoPlayerCardProps {
  lesson: Lesson | null;
  moduleTitle?: string;
  isCompleted: boolean;
  completionFeedback?: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onContinue: () => void;
  onToggleComplete: () => void;
  onNext: () => void;
}

function VideoPlayerCard({
  lesson,
  moduleTitle,
  isCompleted,
  completionFeedback = false,
  isPlaying,
  onPlayPause,
  onContinue,
  onToggleComplete,
  onNext,
}: VideoPlayerCardProps) {
  if (!lesson) {
    return (
      <section className={styles.playerCard}>
        <p className={styles.emptyState}>Nenhuma aula selecionada.</p>
      </section>
    );
  }

  return (
    <section
      className={`${styles.playerCard} ${
        completionFeedback ? styles.playerCardCompletedFlash : ""
      }`}
    >
      <div className={styles.playerHeader}>
        <div>
          <h2 className={styles.lessonTitle}>
            {modulePrefix(moduleTitle)
              ? `${modulePrefix(moduleTitle)} - ${lesson.title}`
              : lesson.title}
          </h2>
          <div className={styles.badgesRow}>
            <span className={styles.badge}>
              <FiClock />
              {lesson.duration}
            </span>
            {isCompleted && (
              <span
                className={`${styles.badge} ${styles.badgeCompleted} ${
                  completionFeedback ? styles.badgePop : ""
                }`}
              >
                <FiCheckCircle />
                Concluída
              </span>
            )}
          </div>
        </div>
        <div className={styles.playerHeaderActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onContinue}
          >
            Continuar de onde parei
          </button>
          <button
            type="button"
            className={styles.secondaryQuietButton}
            onClick={onToggleComplete}
          >
            {isCompleted ? "Marcar como pendente" : "Marcar como concluído"}
          </button>
        </div>
      </div>

      <div className={styles.mockPlayer}>
        {lesson.youtubeId && isPlaying ? (
          <iframe
            key={lesson.youtubeId}
            src={`https://www.youtube.com/embed/${lesson.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className={styles.playerIframe}
          />
        ) : (
          <>
            <Image
              src={lesson.thumbnail}
              alt={lesson.title}
              layout="fill"
              sizes="(max-width: 768px) 100vw, 70vw"
              objectFit="cover"
              className={styles.playerImage}
            />
            <button
              type="button"
              className={styles.playControl}
              onClick={onPlayPause}
              aria-label={isPlaying ? "Pausar aula" : "Iniciar aula"}
            >
              {isPlaying ? <FiPauseCircle /> : <FiPlayCircle />}
            </button>
          </>
        )}
      </div>

      <div className={styles.playerFooterRow}>
        <div className={styles.playerFooterLeft}>
          {lesson.youtubeId ? (
            <a
              className={styles.inlineLink}
              href={`https://www.youtube.com/watch?v=${lesson.youtubeId}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir vídeo no YouTube
            </a>
          ) : (
            <span />
          )}
        </div>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onNext}
        >
          Próxima aula
        </button>
      </div>
    </section>
  );
}

interface ProgressCardProps {
  moduleTitle?: string;
  done: number;
  total: number;
  percent: number;
  nextLessonTitle?: string;
}

function ProgressCard({
  moduleTitle,
  done,
  total,
  percent,
  nextLessonTitle,
}: ProgressCardProps) {
  const [cardHeight, setCardHeight] = useState(320);

  useEffect(() => {
    const storedHeight = window.localStorage.getItem(
      "videos_progress_card_height"
    );
    if (!storedHeight) return;
    const numericHeight = Number(storedHeight);
    if (!Number.isFinite(numericHeight)) return;
    setCardHeight(numericHeight);
  }, []);

  const pending = Math.max(total - done, 0);

  return (
    <section
      className={styles.progressCard}
      style={{ height: `${cardHeight}px` }}
    >
      <span className={styles.progressTitle}>Progresso do Módulo</span>
      <div className={styles.progressNumbers}>
        <strong>{percent}%</strong>
        <span>
          {done}/{total} concluídas
        </span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressValue}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className={styles.progressSummary}>
        <div className={styles.progressSummaryRow}>
          <span>Módulo atual</span>
          <strong>{moduleTitle || "-"}</strong>
        </div>
        <div className={styles.progressSummaryRow}>
          <span>Pendentes</span>
          <strong>{pending}</strong>
        </div>
        <div className={styles.progressSummaryRow}>
          <span>Próxima aula</span>
          <strong className={styles.progressNextLessonTitle}>
            {nextLessonTitle || "Nenhuma aula disponível"}
          </strong>
        </div>
      </div>
    </section>
  );
}

interface ModuleAccordionProps {
  module: ModuleData;
  lessons: Lesson[];
  isOpen: boolean;
  selectedLessonId: string;
  completedLessonIds: string[];
  onToggle: () => void;
  onSelectLesson: (lesson: Lesson) => void;
}

function ModuleAccordion({
  module,
  lessons,
  isOpen,
  selectedLessonId,
  completedLessonIds,
  onToggle,
  onSelectLesson,
}: ModuleAccordionProps) {
  return (
    <div className={styles.moduleBlock}>
      <button type="button" className={styles.moduleTrigger} onClick={onToggle}>
        <div>
          <strong>{module.title}</strong>
          <span>
            {
              completedLessonIds.filter((id) =>
                module.lessons.some((lesson) => lesson.id === id)
              ).length
            }
            /{module.lessons.length} concluídas
          </span>
        </div>
        <FiChevronDown className={isOpen ? styles.iconOpen : ""} />
      </button>

      {isOpen && (
        <div className={styles.lessonsScrollArea}>
          {lessons.length === 0 ? (
            <div className={styles.emptyState}>
              Nenhuma aula neste módulo para este filtro.
            </div>
          ) : (
            lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                isSelected={selectedLessonId === lesson.id}
                isCompleted={completedLessonIds.includes(lesson.id)}
                onClick={() => onSelectLesson(lesson)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface LessonItemProps {
  lesson: Lesson;
  isSelected: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

function LessonItem({
  lesson,
  isSelected,
  isCompleted,
  onClick,
}: LessonItemProps) {
  const isLocked = Boolean(lesson.locked);
  return (
    <button
      type="button"
      className={`${styles.lessonItem} ${
        isSelected ? styles.lessonItemSelected : ""
      }`}
      onClick={onClick}
      disabled={isLocked}
      aria-current={isSelected}
      aria-label={`Aula ${lesson.title}`}
    >
      <Image
        src={lesson.thumbnail}
        alt={lesson.title}
        width={88}
        height={51}
        className={styles.lessonImage}
      />
      <div className={styles.lessonMeta}>
        <span className={styles.lessonMetaTitle}>{lesson.title}</span>
        <span className={styles.lessonMetaDuration}>{lesson.duration}</span>
      </div>
      <span
        className={`${styles.lessonStatus} ${
          isCompleted ? styles.lessonStatusCompleted : ""
        }`}
      >
        {isLocked ? (
          <FiLock />
        ) : isCompleted ? (
          <FiCheckCircle />
        ) : (
          <FiPlayCircle />
        )}
      </span>
    </button>
  );
}

interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterButton({ label, active, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.filterButton} ${
        active ? styles.filterButtonActive : ""
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
