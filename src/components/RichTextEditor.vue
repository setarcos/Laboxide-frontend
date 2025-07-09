<template>
  <div v-if="editor" class="border border-base-300 rounded-md">
    <!-- Toolbar -->
    <div
      class="toolbar p-2 border-b border-base-300 flex items-center gap-1 flex-wrap"
    >
      <div class="join">
        <button
          type="button"
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'btn-active': editor.isActive('bold') }"
          class="btn btn-sm btn-square btn-ghost join-item"
          aria-label="Bold"
          title="Bold"
        >
          <Bold class="w-4 h-4" />
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'btn-active': editor.isActive('italic') }"
          class="btn btn-sm btn-square btn-ghost join-item"
          aria-label="Italic"
          title="Italic"
        >
          <Italic class="w-4 h-4" />
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'btn-active': editor.isActive('strike') }"
          class="btn btn-sm btn-square btn-ghost join-item"
          aria-label="Strikethrough"
          title="Strikethrough"
        >
          <Strikethrough class="w-4 h-4" />
        </button>
      </div>

      <!-- Lists -->
      <div class="join">
        <button
          type="button"
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'btn-active': editor.isActive('bulletList') }"
          class="btn btn-sm btn-square btn-ghost join-item"
          aria-label="Bullet List"
          title="Bullet List"
        >
          <List class="w-4 h-4" />
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'btn-active': editor.isActive('orderedList') }"
          class="btn btn-sm btn-square btn-ghost join-item"
          aria-label="Numbered List"
          title="Numbered List"
        >
          <ListOrdered class="w-4 h-4" />
        </button>
      </div>
      <div class="join">
        <button
          type="button"
          @click="setLink"
          :class="{ 'btn-active': editor.isActive('link') }"
          class="btn btn-sm btn-square btn-ghost join-item"
          aria-label="Set Link"
          title="Set Link"
        >
          <Link class="w-4 h-4" />
        </button>
        <button
          type="button"
          @click="editor.chain().focus().unsetLink().run()"
          :disabled="!editor.isActive('link')"
          class="btn btn-sm btn-square btn-ghost join-item"
          aria-label="Unlink"
          title="Unlink"
        >
          <Unlink class="w-4 h-4" />
        </button>
      </div>
      <div class="join">
        <div class="p-2 border-b border-base-300 flex justify-end">
          <button
            type="button"
            @click="toggleSourceView"
            class="btn btn-sm btn-square btn-ghost"
            :aria-label="isSourceViewActive ? 'Show Editor' : 'Show HTML'"
            :title="isSourceViewActive ? 'Show Editor' : 'Show HTML'"
          >
            <template v-if="isSourceViewActive">
              <Eye class="w-4 h-4" />
            </template>
            <template v-else>
              <Code class="w-4 h-4" />
            </template>
          </button>
        </div>
      </div>
    </div>

    <!-- Editor Content -->
    <div v-if="!isSourceViewActive">
      <editor-content
        v-if="editor"
        :editor="editor"
        class="p-3 min-h-[10rem] prose max-w-none"
      />
    </div>
    <div v-else>
      <textarea
        v-model="sourceCode"
        class="textarea textarea-bordered w-full rounded-t-none font-mono text-sm"
        style="min-height: 10rem"
        placeholder="Edit HTML source code..."
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Unlink,
  Code,
  Eye,
} from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});
const emit = defineEmits(["update:modelValue"]);

const isSourceViewActive = ref(false);
const sourceCode = ref("");

let debounceTimeout = null;
function debounce(fn, delay = 300) {
  return (...args) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

const emitModelValue = debounce((html) => {
  emit("update:modelValue", html);
}, 300);

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    TiptapLink.configure({
      openOnClick: false,
      autolink: true,
    }),
  ],
  editorProps: {
    attributes: {
      class: "prose focus:outline-none max-w-none",
    },
  },
  onUpdate: ({ editor }) => {
    emitModelValue(editor.getHTML());
  },
});

// Watch for external modelValue changes
watch(
  () => props.modelValue,
  (value) => {
    if (!editor?.value) return;
    const current = editor.value.getHTML();
    if (current !== value) {
      editor.value.commands.setContent(value, false);
    }
  },
);

// Toggle between WYSIWYG and source view
const toggleSourceView = () => {
  if (!editor?.value) return;
  isSourceViewActive.value = !isSourceViewActive.value;
  if (isSourceViewActive.value) {
    sourceCode.value = editor.value.getHTML();
  } else {
    editor.value.commands.setContent(sourceCode.value);
  }
};

// Validate URL format
const isValidUrl = (str) => {
  try {
    return Boolean(new URL(str));
  } catch {
    return false;
  }
};

// Set or update a link
const setLink = () => {
  if (!editor?.value) return;
  const previousUrl = editor.value.getAttributes("link").href;
  const url = window.prompt("URL", previousUrl || "");
  if (url === null) return;

  if (url === "") {
    editor.value.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  if (!isValidUrl(url)) {
    alert("Invalid URL");
    return;
  }

  editor.value
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url })
    .run();
};

// Clean up
onBeforeUnmount(() => {
  editor?.value?.destroy?.();
});
</script>

<style>
.tiptap {
  outline: none;
}
.tiptap > p:first-child {
  margin-top: 0;
}
.tiptap > p:last-child {
  margin-bottom: 0;
}
</style>
