<template>
  <div class="vgt-wrap__footer vgt-clearfix">
    <div
      v-if="perPageDropdownEnabled"
      class="footer__row-count vgt-pull-left"
    >
      <form>
        <label
          :for="id"
          class="footer__row-count__label"
        >{{ rowsPerPageText }}</label>
        <select
          :id="id"
          v-model="currentPerPage"
          autocomplete="off"
          name="perPageSelect"
          class="footer__row-count__select"
          aria-controls="vgt-table"
          @change="perPageChanged"
        >
          <option
            v-for="(option, idx) in rowsPerPageOptions"
            :key="idx"
            :value="option"
          >
            {{ option }}
          </option>
          <option
            v-if="paginateDropdownAllowAll"
            :value="total"
          >
            {{ allText }}
          </option>
        </select>
      </form>
    </div>
    <div class="footer__navigation vgt-pull-right">
      <pagination-page-info
        :total-records="total"
        :last-page="pagesCount"
        :current-page="currentPage"
        :current-per-page="currentPerPage"
        :of-text="ofText"
        :page-text="pageText"
        :info-fn="infoFn"
        :mode="mode"
        @page-changed="changePage"
      />
      <button
        type="button"
        title="previous page"
        aria-controls="vgt-table"
        class="footer__navigation__page-btn"
        :class="{ disabled: !prevIsPossible }"
        @click.prevent.stop="previousPage"
      >
        <span
          aria-hidden="true"
          class="chevron"
          :class="{ 'left': !rtl, 'right': rtl }"
        />
        <!-- <span>{{ prevText }}</span> -->
      </button>

      <button
        type="button"
        title="next page"
        aria-controls="vgt-table"
        class="footer__navigation__page-btn"
        :class="{ disabled: !nextIsPossible }"
        @click.prevent.stop="nextPage"
      >
        <!-- <span>{{ nextText }}</span> -->
        <span
          aria-hidden="true"
          class="chevron"
          :class="{ 'right': !rtl, 'left': rtl }"
        />
      </button>
    </div>
  </div>
</template>

<script>
import VgtPaginationPageInfo from './VgtPaginationPageInfo.vue';
import {
  PAGINATION_MODES,
  DEFAULT_ROWS_PER_PAGE_DROPDOWN
} from './constants';

export default {
  name: 'CustomPaginationLabels',

  components: {
    'pagination-page-info': VgtPaginationPageInfo,
  },
  props: {
    styleClass: { default: 'table table-bordered' },
    total: { default: null },
    perPage: null,
    rtl: { default: false },
    perPageDropdownEnabled: { default: true },
    customRowsPerPageDropdown: { default() { return []; } },
    paginateDropdownAllowAll: { default: true },
    mode: { default: PAGINATION_MODES.Records },

    // text options
    nextText: { default: 'Next' },
    prevText: { default: 'Prev' },
    rowsPerPageText: { default: '# rows' },
    ofText: { default: 'of' },
    pageText: { default: 'page' },
    allText: { default: 'All' },
    infoFn: { default: null },
  },

  data() {
    return {
      id: this.getId(),
      currentPage: 1,
      prevPage: 0,
      currentPerPage: null,
      rowsPerPageOptions: [],
    };
  },

  computed: {
    // Number of pages
    pagesCount() {
      const quotient = Math.floor(this.total / this.currentPerPage);
      const remainder = this.total % this.currentPerPage;

      return remainder === 0 ? quotient : quotient + 1;
    },

    // Can go to next page
    nextIsPossible() {
      return this.currentPage < this.pagesCount;
    },

    // Can go to previous page
    prevIsPossible() {
      return this.currentPage > 1;
    },
  },
  watch: {
    perPage: {
      handler(newValue, oldValue) {
        // if (import.meta.env.VITE_DEBUG) console.log('watch perPage, newValue:', newValue, 'oldValue:', oldValue);
        this.handlePerPage();
        this.perPageChanged(oldValue);
      },
      immediate: true,
    },

    customRowsPerPageDropdown: {
      handler() {
        // if (import.meta.env.VITE_DEBUG) console.log('watch customRowsPerPageDropdown');
        this.handlePerPage();
      },
      deep: true,
    },

    total: {
      handler(newValue) {
        // this.handlePerPage();
        // if (import.meta.env.VITE_DEBUG) console.log('watch total changed, newValue:', newValue, 'this.currentPerPage:', this.currentPerPage, 'this.rowsPerPageOptions:', this.rowsPerPageOptions);
        if(this.rowsPerPageOptions.indexOf(this.currentPerPage) === -1) {
          this.currentPerPage = newValue;
        }
      }
    }
  },

  mounted() {
    // if (import.meta.env.VITE_DEBUG) console.log('CustomPaginationLabels mounted');
  },

  methods: {
    getId() {
      return `vgt-select-rpp-${Math.floor(Math.random() * Date.now())}`;
    },
    // Change current page
    changePage(pageNumber, emit = true) {
      if (pageNumber > 0 && this.total > this.currentPerPage * (pageNumber - 1)) {
        this.prevPage = this.currentPage;
        this.currentPage = pageNumber;
        this.pageChanged(emit);
      }
    },

    // Go to next page
    nextPage() {
      // if (import.meta.env.VITE_DEBUG) console.log('nextPage is running, this.nextIsPossible:', this.nextIsPossible, 'this.currentPage:', this.currentPage);
      if (this.nextIsPossible) {
        this.prevPage = this.currentPage;
        ++this.currentPage;
        this.pageChanged();
      }
    },

    // Go to previous page
    previousPage() {
      if (this.prevIsPossible) {
        this.prevPage = this.currentPage;
        --this.currentPage;
        this.pageChanged();
      }
    },

    // Indicate page changing
    pageChanged(emit = true) {
      const payload = {
        currentPage: this.currentPage,
        prevPage: this.prevPage,
      };
      if (!emit) payload.noEmit = true;
      this.$emit('page-changed', payload);
    },

    // Indicate per page changing
    perPageChanged(oldValue) {
      // if (import.meta.env.VITE_DEBUG) console.log('perPageChanged is running, this.currentPerPage:', this.currentPerPage, 'this.perPage:', this.perPage, 'oldValue:', oldValue);
      // go back to first page
      if (oldValue) {
        //* only emit if this isn't first initialization
        this.$emit('per-page-changed', { currentPerPage: this.currentPerPage });
        this.$emit('per-page-changed-left-panel', { currentPerPage: this.currentPerPage });
      }
      this.changePage(1, false);
    },

    // Handle per page changing
    handlePerPage() {
      //* if there's a custom dropdown then we use that
      if (this.customRowsPerPageDropdown !== null
        && (Array.isArray(this.customRowsPerPageDropdown)
        && this.customRowsPerPageDropdown.length !== 0)) {
        this.rowsPerPageOptions = JSON.parse(JSON.stringify(this.customRowsPerPageDropdown));
      } else {
        //* otherwise we use the default rows per page dropdown
        this.rowsPerPageOptions = JSON.parse(JSON.stringify(DEFAULT_ROWS_PER_PAGE_DROPDOWN));
      }

      if (this.perPage) {
        this.currentPerPage = this.perPage;
        // if perPage doesn't already exist, we add it
        let found = false;
        for (let i = 0; i < this.rowsPerPageOptions.length; i++) {
          if (this.rowsPerPageOptions[i] === this.perPage) {
            found = true;
          }
        }
        if (!found && this.perPage !== -1) {
          this.rowsPerPageOptions.unshift(this.perPage);
        }
      } else if (this.currentPerPage) {
        // if perPage is not set, but currentPerPage is, we set perPage to currentPerPage
        this.perPage = this.currentPerPage;
      } else {
        // reset to default
        this.currentPerPage = 5;
      }
    },
  },
};
</script>

<style lang="scss">

</style>
