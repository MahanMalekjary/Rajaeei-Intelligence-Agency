import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase.js';

let supabaseClient = null;

async function getClient() {
    if (supabaseClient) return supabaseClient;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error("Please configure supabase.js");
    }
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
}

export async function getPeople(owner, searchQuery = '', filters = {}) {
    const sb = await getClient();
    let query = sb.from('people').select('*').eq('owner', owner).order('created_at', { ascending: false });
    
    if (searchQuery) {
        query = query.or(`data->>name.ilike.%${searchQuery}%,data->>country.ilike.%${searchQuery}%,data->>city.ilike.%${searchQuery}%,data->>occupation.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function getPersonById(id) {
    const sb = await getClient();
    const { data, error } = await sb.from('people').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
}

export async function createPerson(owner, data) {
    const sb = await getClient();
    const { data: person, error } = await sb.from('people').insert([{ owner, data }]).select().single();
    if (error) throw error;
    return person;
}

export async function updatePerson(id, data) {
    const sb = await getClient();
    const { error } = await sb.from('people').update({ data, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
}

export async function deletePerson(id) {
    const sb = await getClient();
    // Delete images from storage first
    const images = await getImages(id);
    for (let img of images) {
        const fileName = img.url.split('/').pop();
        await sb.storage.from('people-images').remove([fileName]);
    }
    await sb.from('people_images').delete().eq('person_id', id);
    const { error } = await sb.from('people').delete().eq('id', id);
    if (error) throw error;
}



export async function uploadImage(personId, file, onProgress) {
    const sb = await getClient();
    const ext = file.name.split('.').pop();
    const fileName = `${personId}/${Date.now()}.${ext}`;
    
    const { data, error } = await sb.storage.from('people-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
    });

    if (error) throw error;

    const publicUrl = sb.storage.from('people-images').getPublicUrl(fileName).data.publicUrl;
    
    const { data: imgData, error: dbError } = await sb.from('people_images').insert([{ person_id: personId, url: publicUrl }]).select().single();
    if (dbError) throw dbError;
    return imgData;
}

export async function getImages(personId) {
    const sb = await getClient();
    const { data, error } = await sb.from('people_images').select('*').eq('person_id', personId).order('sort_order', { ascending: true });
    return data || [];
}

export async function deleteImage(imageId, url) {
    const sb = await getClient();
    const fileName = url.split('/').pop();
    await sb.storage.from('people-images').remove([fileName]);
    const { error } = await sb.from('people_images').delete().eq('id', imageId);
    if (error) throw error;
}

export async function updateImageOrder(imageId, order) {
    const sb = await getClient();
    const { error } = await sb.from('people_images').update({ sort_order: order }).eq('id', imageId);
    if (error) throw error;
}