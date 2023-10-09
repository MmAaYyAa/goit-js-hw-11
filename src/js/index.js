
import { serviceGetPhotos } from "./api";
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const form = document.querySelector('#search-form');
const input = form.elements['searchQuery']
const searchBtn = form.querySelector('button[type="submit"]');
const gallery = document.querySelector('.gallery');
const loadBtn = document.querySelector('.load-more');

let currentPage = 1;
const perPage = 40;
let query = '';
let pageQuantity = null;

loadBtn.classList.add('is-hidden');
searchBtn.disabled = true;

input.addEventListener('focus', handleFocusInput);

function handleFocusInput(event) {
    searchBtn.disabled = false;
    form.addEventListener('submit', handleSearch)
}

async function handleSearch(event) {
    handleFocusInput()
    event.preventDefault();
    gallery.innerHTML = "";
    currentPage = 1;
    const { searchQuery } = event.currentTarget.elements;
    query = searchQuery.value.trim();
    console.log(query)

    if (event.type === 'submit') {
        loadBtn.classList.add('is-hidden')

        try {
            const getPhotos = await serviceGetPhotos(query);
            const { hits, totalHits } = getPhotos;

            if (!hits.length) {
                Notify.failure('Sorry, there are no images matching your search query. Please try again.');
                return;
            }

            Notify.info(`Hooray! We found ${totalHits} images.`);
            
            gallery.insertAdjacentHTML('beforeend', createMarkupGallery(hits));

            createLightbox();

            pageQuantity = Math.ceil(totalHits / perPage);

            if (currentPage < pageQuantity) {
                loadBtn.classList.remove('is-hidden');
                loadBtn.addEventListener('click', handleLoad)
            }
        }
        catch (error) {
            Notify.failure(error.message);
        }
    }
}

async function handleLoad() {
    currentPage += 1;

    try {
        const { hits } = await serviceGetPhotos(query, currentPage);

        gallery.insertAdjacentHTML('beforeend', createMarkupGallery(hits));

         createLightbox();
        scrollGallery();

        if (currentPage === pageQuantity) {
            Notify.info("We're sorry, but you've reached the end of search results.");
            loadBtn.classList.add('is-hidden');
        }
    }
    catch (error) {
        Notify.failure(error.message);
    }
}

function createMarkupGallery(hits) {
    return hits.map(({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) => {
        return `<a href="${largeImageURL}" class="link-lightbox"><div class="photo-card">
        <img src="${webformatURL}" alt="${tags}" loading="lazy" />
        <div class="info">
          <p class="info-item">
            <b>Likes ${likes}</b>
          </p>
          <p class="info-item">
            <b>Views ${views}</b>
          </p>
          <p class="info-item">
            <b>Comments ${comments}</b>
          </p>
          <p class="info-item">
            <b>Downloads ${downloads}</b>
          </p>
        </div>
      </div>
      </a>`
    }).join('');

}

function createLightbox() {
    const lightbox = new SimpleLightbox('.gallery a', {
        captions: true,
        captionsData: 'alt',
        captionDelay: 250,
    });
    lightbox.refresh();
}

function scrollGallery() {
    const { height: cardHeight } = document
        .querySelector(".gallery")
        .firstElementChild.getBoundingClientRect();

    window.scrollBy({
        top: cardHeight * 2,
        behavior: "smooth",
    });
}