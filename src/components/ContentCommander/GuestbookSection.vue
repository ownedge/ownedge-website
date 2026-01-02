<script setup>
import { ref, onMounted, computed } from 'vue';
import SoundManager from '../../sfx/SoundManager';

const entries = ref([]);
const isModalOpen = ref(false);
const isSubmitting = ref(false);
const showSuccess = ref(false);
const isSigned = ref(false);

const newEntry = ref({
  name: '',
  message: '',
  rating: 5
});

const API_URL = import.meta.env.PROD 
  ? '/guestbook.php' 
  : 'http://localhost:8000/guestbook.php';

const fetchEntries = async () => {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            entries.value = await response.json();
            entries.value.reverse(); // Newest first
        }
    } catch (err) {
        console.error('Failed to fetch guestbook:', err);
    }
};

const checkIsSigned = () => {
    isSigned.value = document.cookie.split(';').some(c => c.trim().startsWith('guestbook_signed='));
};

const openModal = () => {
    if (isSigned.value) return;
    isModalOpen.value = true;
    SoundManager.playTypingSound();
};

const closeModal = () => {
    isModalOpen.value = false;
};

const setRating = (val) => {
    newEntry.value.rating = val;
    SoundManager.playTypingSound();
};

const handleSubmit = async () => {
    if (isSubmitting.value || !newEntry.value.message.trim()) return;
    
    isSubmitting.value = true;
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry.value)
        });
        
        if (response.ok) {
            // Set cookie for 1 year
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            document.cookie = `guestbook_signed=true; expires=${date.toUTCString()}; path=/`;
            
            isSigned.value = true;
            showSuccess.value = true;
            await fetchEntries();
            
            setTimeout(() => {
                isModalOpen.value = false;
                showSuccess.value = false;
                newEntry.value = { name: '', message: '', rating: 5 };
            }, 2000);
        }
    } catch (err) {
        console.error('Submission failed:', err);
    } finally {
        isSubmitting.value = false;
    }
};

const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

onMounted(() => {
    fetchEntries();
    checkIsSigned();
});
</script>

<template>
  <div class="section-content animate-in">
    <div class="header-row">
        <h3>> GUEST LOG</h3>
        <button 
          class="sign-btn" 
          @click="openModal" 
          :disabled="isSigned"
        >
            {{ isSigned ? '[ SIGNED ]' : '[ SIGN GUESTBOOK ]' }}
        </button>
    </div>
    
    <p class="subtitle">Leave your mark on the system memory.</p>

    <div class="entries-grid">
      <div v-for="entry in entries" :key="entry.id" class="entry-box">
        <div class="entry-header">
          <span class="entry-name">{{ entry.name || 'ANONYMOUS' }}</span>
          <span class="entry-date">{{ formatDate(entry.timestamp) }}</span>
        </div>
        <div class="entry-stars">
          <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= entry.rating }">★</span>
        </div>
        <p class="entry-message">{{ entry.message }}</p>
      </div>
    </div>

    <!-- Modal Overlay -->
    <Transition name="fade">
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content animate-pop">
          <h4>SIGN GUEST LOG</h4>
          
          <div v-if="!showSuccess" class="form-body">
            <div class="form-group">
                <label>OPERATOR NAME:</label>
                <input v-model="newEntry.name" type="text" maxlength="32" placeholder="ANONYMOUS" />
            </div>

            <div class="form-group">
                <label>FEEDBACK (MAX 256):</label>
                <textarea v-model="newEntry.message" maxlength="256" placeholder="TYPE MESSAGE..."></textarea>
            </div>

            <div class="form-group">
                <label>RATING:</label>
                <div class="star-rating-input">
                    <span 
                      v-for="n in 5" 
                      :key="n" 
                      class="interactive-star" 
                      :class="{ filled: n <= newEntry.rating }"
                      @click="setRating(n)"
                    >★</span>
                </div>
            </div>

            <div class="modal-actions">
                <button class="cancel-btn" @click="closeModal">CANCEL</button>
                <button 
                  class="submit-btn" 
                  @click="handleSubmit" 
                  :disabled="isSubmitting || !newEntry.message.trim()"
                >
                    {{ isSubmitting ? 'TRANSMITTING...' : 'SUBMIT ENTRY' }}
                </button>
            </div>
          </div>

          <div v-else class="success-message">
              <span class="blink">></span> ENTRY RECORDED SUCCESSFULLY.
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.section-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.section-content h3 {
    margin: 0;
    color: var(--color-accent);
    border-bottom: 1px solid rgba(64, 224, 208, 0.3);
    display: inline-block;
    padding-bottom: 5px;
    font-size: 1.4rem;
    letter-spacing: 1px;
}

.sign-btn {
    background: transparent;
    border: none;
    color: var(--color-accent);
    font-family: 'JetBrains Mono', monospace;
    font-weight: bold;
    cursor: pointer;
    letter-spacing: 1px;
    transition: all 0.2s ease;
    padding: 5px 10px;
}

.sign-btn:hover:not(:disabled) {
    background: rgba(64, 224, 208, 0.1);
    text-shadow: 0 0 8px var(--color-accent);
}

.sign-btn:disabled {
    color: #444;
    cursor: default;
}

.subtitle {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 30px;
}

.entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    overflow-y: auto;
    padding-right: 10px;
    scrollbar-width: thin;
    scrollbar-color: #333 transparent;
}

.entry-box {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid #222;
    padding: 20px;
    border-radius: 10px;
    transition: border-color 0.2s ease;
}

.entry-box:hover {
    border-color: #444;
}

.entry-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 0.8rem;
}

.entry-name {
    color: var(--color-accent);
    font-weight: bold;
    letter-spacing: 1px;
}

.entry-date {
    color: #555;
}

.entry-stars {
    margin-bottom: 15px;
    font-size: 0.9rem;
}

.star {
    color: #222;
    margin-right: 2px;
}

.star.filled {
    color: #ffcc00;
    text-shadow: 0 0 5px rgba(255, 204, 0, 0.4);
}

.entry-message {
    font-size: 1rem;
    line-height: 1.5;
    color: #ccc;
    word-break: break-word;
}

/* Modal Styling */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: #0a0a0a;
    border: 1px solid #333;
    padding: 30px;
    width: 450px;
    max-width: 90%;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

.modal-content h4 {
    margin-top: 0;
    color: #fff;
    margin-bottom: 25px;
    letter-spacing: 2px;
    text-align: center;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    font-size: 0.75rem;
    color: #666;
    margin-bottom: 8px;
    letter-spacing: 1px;
}

.form-group input, 
.form-group textarea {
    width: 100%;
    background: #111;
    border: 1px solid #333;
    color: #fff;
    padding: 12px;
    font-family: inherit;
    font-size: 0.95rem;
    outline: none;
}

.form-group input:focus, 
.form-group textarea:focus {
    border-color: var(--color-accent);
}

.form-group textarea {
    height: 100px;
    resize: none;
}

.star-rating-input {
    display: flex;
    gap: 8px;
    font-size: 1.5rem;
}

.interactive-star {
    cursor: pointer;
    color: #222;
    transition: transform 0.1s ease;
}

.interactive-star:hover {
    transform: scale(1.2);
}

.interactive-star.filled {
    color: #ffcc00;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 30px;
}

.cancel-btn, .submit-btn {
    padding: 10px 20px;
    font-family: inherit;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 4px;
    font-weight: bold;
    letter-spacing: 1px;
}

.cancel-btn {
    background: transparent;
    border: none;
    color: #666;
}

.submit-btn {
    background: var(--color-accent);
    color: #000;
    border: none;
}

.submit-btn:disabled {
    opacity: 0.5;
    cursor: default;
}

.success-message {
    text-align: center;
    color: var(--color-accent);
    font-weight: bold;
    padding: 20px 0;
}

.blink { animation: blink-fast 0.6s step-end infinite; }

.animate-in { animation: slideUp 0.3s ease-out; }
.animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes popIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes blink-fast { 50% { opacity: 0; } }

/* Transition magic */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
    .entries-grid {
        grid-template-columns: 1fr;
    }
}
</style>
