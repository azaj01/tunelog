// To make api calls to the backend script


// import { useState } from "react"


const BASE_URL = "http://localhost:8000"




export interface Stats {
    total_songs: number
    total_listens: number
    signals: {
        positive: number
        skip: number
        partial: number
        repeat: number
    }
    most_played_artists: Record<string, number>
    most_played_songs: {
        title: string
        artist: string
        play_count: number
    }[]
}

export async function fetchStats(): Promise<Stats> {
    console.log("Calling API")
    console.log(`calling api on url :  ${BASE_URL}/api/stats`);
    const res = await fetch(`${BASE_URL}/api/stats`)
    const response = res.json()
    console.log(response)
    if (!res.ok) {
        throw new Error("Failed to fetch stats")
    }
    
    return response
}

